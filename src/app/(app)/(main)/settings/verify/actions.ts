"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { institutions, userProfiles } from "@/db/schema";
import { getCachedAuthUser, getCachedBareProfile, invalidateProfileCache } from "@/lib/server-cache";
import { getViewerInstitutionId } from "@/lib/viewer";

export type PickCollegeResult = { ok: true; collegeName: string } | { ok: false; error: string };

/**
 * Moves a profile out of the legacy Campus Preview hub into the college the
 * student picked, as an unverified member. Only works from the hub: a student
 * already on a campus changes it by verifying a college email instead.
 */
export async function pickCollege(institutionId: string): Promise<PickCollegeResult> {
  const user = await getCachedAuthUser().catch(() => null);
  if (!user) return { ok: false, error: "You're signed out. Sign in again." };
  const profile = await getCachedBareProfile(user.id);
  if (!profile) return { ok: false, error: "Finish setting up your profile first." };

  const hubId = await getViewerInstitutionId();
  if (profile.institutionId !== hubId) {
    return { ok: false, error: "You're already on a campus. Verify a college email to switch to that college." };
  }

  const id = typeof institutionId === "string" ? institutionId.trim() : "";
  if (!id || id === hubId) return { ok: false, error: "Pick a college from the list." };

  const db = getDb();
  const college = await db.query.institutions.findFirst({
    where: eq(institutions.id, id),
    columns: { id: true, name: true, source: true },
  });
  if (!college || college.source === "system") return { ok: false, error: "We couldn't find that college." };

  await db
    .update(userProfiles)
    .set({ institutionId: college.id, updatedAt: new Date() })
    .where(eq(userProfiles.id, profile.id));
  invalidateProfileCache(user.id);
  revalidatePath("/settings/verify");
  return { ok: true, collegeName: college.name };
}
