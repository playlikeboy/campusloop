"use server";

import { and, count, eq, inArray, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { institutionDomains, institutions, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { runInBackground } from "@/lib/background";
import { sendEmail } from "@/lib/email";
import { buildWelcomeEmail } from "@/lib/email-templates";
import { followUser } from "@/lib/follows";
import { findWhitelistedDomain } from "@/lib/institutions";
import { createNotification } from "@/lib/notifications";
import { getRecommendedUsers } from "@/lib/recommendations/recommended-users";
import { seedInterestVector } from "@/lib/recommendations/interest-vector";
import { creditInviter } from "@/lib/referrals/credit";
import { canCreditInvite, INVITE_COOKIE, pickInviter, REF_COOKIE } from "@/lib/referrals/invite";
import { invalidateProfileCache } from "@/lib/server-cache";
import { getAvatarUrl } from "@/lib/utils";
import { validateDisplayName, validateUsername } from "@/lib/validation";
import { getViewerInstitutionId } from "@/lib/viewer";

export type OnboardingResult =
  | { success: true; profileId: string; isVerifiedStudent: boolean }
  /** `step` is the onboarding step that holds the field to fix. */
  | { success: false; error: string; step?: number };

/**
 * Errors come back as values, not throws: Next.js hides thrown messages from
 * server actions in production, and the student needs to know what to fix.
 */
export async function completeOnboarding(formData: FormData): Promise<OnboardingResult> {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    return { success: false, error: "You're signed out. Sign in again to finish your profile." };
  }

  const email = user.primaryEmail;
  if (!email) {
    return {
      success: false,
      error: "Your account has no email address. Sign out and sign up with your college email.",
    };
  }

  const username = formData.get("username") as string;
  const displayName = formData.get("displayName") as string;
  const rawGender = formData.get("gender") as string;
  const avatarUrl = (formData.get("avatarUrl") as string) || null;
  const course = (formData.get("course") as string)?.trim() || null;
  const branch = (formData.get("branch") as string)?.trim() || null;
  const rawYear = formData.get("year");
  const year = rawYear ? Number(rawYear) || 1 : null;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const dob = (formData.get("dob") as string)?.trim() || null;
  const isDobPrivate = formData.get("isDobPrivate") === "true" || formData.get("isDobPrivate") === "on";
  const interestsRaw = (formData.get("interests") as string) || "[]";
  let interests: string[] = [];
  try {
    interests = JSON.parse(interestsRaw);
  } catch {
    interests = [];
  }

  // Campus Preview (aspirant) fields. An aspirant has no year of study, and
  // picks the campuses they are aiming for instead of a branch.
  const aspirantStage = (formData.get("aspirantStage") as string)?.trim() || null;
  const targetIdsRaw = (formData.get("targetInstitutionIds") as string) || "[]";
  let targetInstitutionIds: string[] = [];
  try {
    const parsed = JSON.parse(targetIdsRaw);
    if (Array.isArray(parsed)) {
      targetInstitutionIds = parsed
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        .slice(0, 5);
    }
  } catch {
    targetInstitutionIds = [];
  }

  // Gender is asked only when the student opts into Campus Match (see the
  // dating gender gate). A new profile stores null rather than the column's
  // old default, so nobody is matched on a gender they never chose.
  const gender =
    rawGender && ["MALE", "FEMALE", "OTHER"].includes(rawGender)
      ? (rawGender as "MALE" | "FEMALE" | "OTHER")
      : null;

  // Strict Name & Username Validation
  const nameVal = validateDisplayName(displayName);
  if (!nameVal.isValid) {
    return { success: false, error: nameVal.error ?? "Check your name.", step: 0 };
  }

  const userVal = validateUsername(username);
  if (!userVal.isValid) {
    return { success: false, error: userVal.error ?? "Check your username.", step: 0 };
  }

  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) {
    return { success: false, error: "Your email address looks wrong. Sign out and sign up again." };
  }

  const db = getDb();

  const whitelistedDomain =
    (await findWhitelistedDomain(domain)) ||
    (await db.query.institutionDomains.findFirst({
      where: eq(institutionDomains.domain, domain),
    }));

  // A college domain only grants campus access once the provider confirms the
  // student can actually read that inbox. Signing up with someone else's
  // college address and never verifying it must not hand over their campus.
  const isVerifiedCollegeEmail = Boolean(whitelistedDomain) && user.primaryEmailVerified;

  // Everyone else joins the college they picked as an unverified member (what
  // they can do is set on /admin/access, see src/lib/trust.ts). An aspirant
  // who isn't in college yet picks none and lands in the Campus Preview hub.
  // Either way they can verify later without losing anything.
  let institutionId: string;
  if (isVerifiedCollegeEmail) {
    institutionId = whitelistedDomain!.institutionId;
  } else {
    const viewerHubId = await getViewerInstitutionId();
    const picked = ((formData.get("institutionId") as string) || "").trim();
    if (picked && picked !== viewerHubId) {
      const college = await db.query.institutions.findFirst({
        where: eq(institutions.id, picked),
        columns: { id: true, source: true },
      });
      if (!college || college.source === "system") {
        return { success: false, error: "We couldn't find that college. Search for it again.", step: 0 };
      }
      institutionId = college.id;
    } else {
      institutionId = viewerHubId;
    }
  }
  const verifiedFields = isVerifiedCollegeEmail
    ? { verificationMethod: "college_email" as const, verifiedAt: new Date() }
    : {};

  // Invite tracking. The inviter is remembered on the profile for everyone who
  // joined through a link, and credited once the invited student is verified
  // (here, or later in the campus upgrade flow).
  const cookieStore = await cookies();
  const inviterUsername = pickInviter(
    cookieStore.get(INVITE_COOKIE)?.value,
    cookieStore.get(REF_COOKIE)?.value
  );
  const existingProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
    columns: { id: true, onboardingCompleted: true },
  });
  const wasAlreadyOnboarded = Boolean(existingProfile?.onboardingCompleted);

  let referrerProfile: { id: string; userId: string } | null = null;
  if (inviterUsername && !wasAlreadyOnboarded) {
    const found = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.username, inviterUsername),
      columns: { id: true, userId: true },
    });
    if (found && found.userId !== user.id) referrerProfile = found;
  }
  const referrerId = referrerProfile?.id ?? null;

  const rawUsername = email.split("@")[0] || "student";
  const officialName = rawUsername
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const cleanAvatarUrl = avatarUrl || getAvatarUrl(null, username, displayName);

  // Only aspirants carry a stage; for students the branch and year say it.
  const headline =
    aspirantStage && !isVerifiedCollegeEmail ? `${aspirantStage} · ${branch ?? "Aspirant"}` : null;

  let savedProfileId = existingProfile?.id ?? "";
  try {
    const [saved] = await db
      .insert(userProfiles)
      .values({
        userId: user.id,
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        officialName,
        avatarUrl: cleanAvatarUrl,
        gender,
        dob,
        isDobPrivate,
        course,
        branch,
        year,
        bio,
        headline,
        interests,
        targetInstitutionIds,
        institutionId,
        referredById: referrerId,
        onboardingCompleted: true,
        isCollegeVerified: isVerifiedCollegeEmail,
        ...verifiedFields,
        role: "STUDENT",
        status: "ACTIVE",
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          displayName: displayName.trim(),
          avatarUrl: cleanAvatarUrl,
          dob,
          isDobPrivate,
          course,
          branch,
          year,
          bio,
          headline,
          interests,
          targetInstitutionIds,
          institutionId,
          isCollegeVerified: isVerifiedCollegeEmail,
          ...verifiedFields,
          onboardingCompleted: true,
          // Never overwrite a gender chosen earlier with "not given".
          ...(gender ? { gender } : {}),
          // A profile row created before onboarding has no inviter yet.
          ...(referrerId && !wasAlreadyOnboarded ? { referredById: referrerId } : {}),
        },
      })
      .returning({ id: userProfiles.id });
    savedProfileId = saved?.id ?? savedProfileId;
    invalidateProfileCache(user.id);

    if (
      referrerProfile &&
      canCreditInvite({
        inviterUserId: referrerProfile.userId,
        invitedUserId: user.id,
        isVerifiedStudent: isVerifiedCollegeEmail,
        wasAlreadyOnboarded,
      })
    ) {
      try {
        // Both sides get Loop Points: the inviter and the student who just joined.
        await creditInviter(referrerProfile.id, savedProfileId || undefined);
      } catch (error) {
        console.error("[invite] Failed to credit inviter:", error);
      }
    }
    try {
      cookieStore.delete(INVITE_COOKIE);
      cookieStore.delete(REF_COOKIE);
    } catch {
      // Cookies are best-effort here; the onboarded check above prevents a second credit.
    }

    // Dispatch welcome email asynchronously via mail.campusloop.space
    try {
      let collegeName = "CampusLoop";
      if (institutionId) {
        const inst = await db.query.institutions.findFirst({
          where: eq(institutions.id, institutionId),
          columns: { name: true },
        });
        if (inst?.name) collegeName = inst.name;
      }

      const { subject, html, text } = buildWelcomeEmail({
        displayName: displayName.trim(),
        collegeName,
      });

      runInBackground(
        sendEmail({
          to: email.trim().toLowerCase(),
          from: "welcome@mail.campusloop.space",
          fromName: "CampusLoop",
          subject,
          html,
          text,
        }),
        "onboarding welcome email"
      );
    } catch {
      // Non-blocking email dispatch
    }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return { success: false, error: "That username is taken. Pick a different one.", step: 0 };
    }
    throw error;
  }

  return { success: true, profileId: savedProfileId, isVerifiedStudent: isVerifiedCollegeEmail };
}

async function currentProfile() {
  const user = await hexclaveServerApp.getUser();
  if (!user) return null;
  return (
    (await getDb().query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      columns: { id: true, username: true, institutionId: true, interests: true, isCollegeVerified: true },
    })) ?? null
  );
}

/**
 * Screen 2: the taste swipe. Likes and skips on real posts seed the feed's
 * interest vector, and any picked interest chips are added to the profile.
 */
export async function saveTasteQuiz(input: {
  likedPostIds: string[];
  skippedPostIds: string[];
  interests: string[];
}): Promise<{ success: boolean }> {
  const profile = await currentProfile();
  if (!profile) return { success: false };

  const clean = (ids: unknown) =>
    Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string").slice(0, 20) : [];
  const likedPostIds = clean(input.likedPostIds);
  const skippedPostIds = clean(input.skippedPostIds);
  const picked = clean(input.interests).map((tag) => tag.slice(0, 40));
  const interests = Array.from(new Set([...(profile.interests ?? []), ...picked])).slice(0, 20);

  if (picked.length > 0) {
    await getDb().update(userProfiles).set({ interests }).where(eq(userProfiles.id, profile.id));
  }

  try {
    await seedInterestVector(profile.id, { likedPostIds, skippedPostIds, interests });
  } catch (error) {
    // The feed still works without a seeded vector; it just starts less personal.
    console.error("[onboarding] seedInterestVector failed:", error);
  }
  return { success: true };
}

export interface FollowSuggestion {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  detail: string | null;
  sameCampus: boolean;
}

export interface FollowSuggestions {
  campusName: string | null;
  /** Real count of verified classmates already on CampusLoop, not counting the student. */
  classmates: number;
  people: FollowSuggestion[];
}

/** Screen 3: who to follow. The headline count is a direct count of real classmates. */
export async function getFollowSuggestions(): Promise<FollowSuggestions> {
  const profile = await currentProfile();
  if (!profile) return { campusName: null, classmates: 0, people: [] };
  const db = getDb();

  const [institution, classmateRows, recommended] = await Promise.all([
    db.query.institutions.findFirst({
      where: eq(institutions.id, profile.institutionId),
      columns: { name: true, slug: true },
    }),
    profile.isCollegeVerified
      ? db
          .select({ n: count() })
          .from(userProfiles)
          .where(
            and(
              eq(userProfiles.institutionId, profile.institutionId),
              ne(userProfiles.id, profile.id),
              eq(userProfiles.isCollegeVerified, true),
              eq(userProfiles.isSeeded, false),
              eq(userProfiles.status, "ACTIVE")
            )
          )
      : Promise.resolve([{ n: 0 }]),
    getRecommendedUsers(profile.id, { limit: 16, scope: "CAMPUS" }).catch(() => []),
  ]);

  // Only real students: seeded demo profiles never show up as people to follow.
  const ids = recommended.map((u) => u.id);
  const real = ids.length
    ? await db
        .select({ id: userProfiles.id })
        .from(userProfiles)
        .where(and(inArray(userProfiles.id, ids), eq(userProfiles.isSeeded, false), eq(userProfiles.status, "ACTIVE")))
    : [];
  const realIds = new Set(real.map((r) => r.id));

  const people = recommended
    .filter((u) => realIds.has(u.id))
    .map((u) => ({
      id: u.id,
      displayName: u.displayName,
      username: u.username,
      avatarUrl: u.avatarUrl,
      detail: [u.branch, u.year ? `Year ${u.year}` : null].filter(Boolean).join(" · ") || u.institution?.name || null,
      sameCampus: Boolean(institution?.slug && u.institution?.slug === institution.slug),
    }))
    .sort((a, b) => Number(b.sameCampus) - Number(a.sameCampus))
    .slice(0, 12);

  return {
    campusName: institution?.name ? institution.name.split(",")[0].trim() : null,
    classmates: Number(classmateRows[0]?.n ?? 0),
    people,
  };
}

/** Follows the picked students in one go. Each new follow notifies that student, as a normal follow does. */
export async function followSuggested(profileIds: string[]): Promise<{ followed: number }> {
  const profile = await currentProfile();
  if (!profile || !Array.isArray(profileIds)) return { followed: 0 };
  const ids = Array.from(new Set(profileIds.filter((id) => typeof id === "string" && id !== profile.id))).slice(0, 20);

  let followed = 0;
  for (const id of ids) {
    try {
      const result = await followUser(profile.id, id);
      if (result.created) {
        followed += 1;
        await createNotification({
          userId: id,
          actorId: profile.id,
          type: result.isFriend ? "FRIEND" : "FOLLOW",
          referenceId: profile.username,
        });
      }
    } catch (error) {
      console.error("[onboarding] follow failed:", error);
    }
  }
  return { followed };
}
