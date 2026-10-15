import { and, eq, inArray, ne, notInArray, or, type SQL, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDatingCandidatePhotoSet } from "@/constants/dating-photos";
import { getDb } from "@/db";
import { blocks, swipes, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import {
  type CandidateMarketStats,
  isMutualGenderMatch,
  rankDatingCandidates,
  resolveGenderPreference,
} from "@/lib/dating";
import { getViewerInstitutionId, rejectViewerWrite } from "@/lib/viewer";
import { getShowSeededPosts } from "@/lib/platform-config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      with: {
        institution: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    // Strict Gate: Must have gender set to access matching
    const validGenders = ["MALE", "FEMALE", "OTHER"];
    if (!profile.gender || !validGenders.includes(profile.gender)) {
      return NextResponse.json(
        {
          error: "GENDER_REQUIRED",
          message: "Gender is required to access Campus Match.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    // Precedence: explicit query param > saved DB preference > smart default
    // (male sees women, female sees men, other sees everyone).
    const prefs = profile.datingPreferences ?? {};
    const isMatchingEnabled = prefs.isEnabled !== false;
    const requestedGender = searchParams.get("gender") ?? prefs.gender ?? null;
    const genderFilter = resolveGenderPreference(
      profile.gender,
      requestedGender === "DEFAULT" ? null : requestedGender
    );
    const collegeFilter = searchParams.get("scope") || prefs.scope || "GLOBAL"; // CAMPUS, GLOBAL
    const targetInstitutionId = searchParams.get("collegeId") || searchParams.get("targetInstitutionId");
    const sort = searchParams.get("sort") || prefs.sort || "COMPATIBILITY";

    // Everyone I already swiped on, everyone who already liked me, and blocks in either direction.
    const [swiped, likedMeRows, blockRows] = await Promise.all([
      db.select({ id: swipes.targetId }).from(swipes).where(eq(swipes.swiperId, profile.id)),
      db
        .select({ id: swipes.swiperId })
        .from(swipes)
        .where(and(eq(swipes.targetId, profile.id), eq(swipes.direction, "LIKE"))),
      db
        .select({ blockerId: blocks.blockerId, blockedUserId: blocks.blockedUserId })
        .from(blocks)
        .where(or(eq(blocks.blockerId, profile.id), eq(blocks.blockedUserId, profile.id))),
    ]);

    const swipedIds = swiped.map((s) => s.id);
    const blockedIds = blockRows.map((b) => (b.blockerId === profile.id ? b.blockedUserId : b.blockerId));
    const excludedIds = [...new Set([...swipedIds, ...blockedIds])];
    const likedMeIds = new Set(likedMeRows.map((s) => s.id));

    const viewerInstitutionId = await getViewerInstitutionId();
    const showSeeded = await getShowSeededPosts();
    const conditions: (SQL | undefined)[] = [
      ne(userProfiles.id, profile.id), // Exclude self
      eq(userProfiles.status, "ACTIVE"), // Only active students
      ...(showSeeded ? [] : [eq(userProfiles.isSeeded, false)]), // Conditionally filter synthetic profiles
      ne(userProfiles.institutionId, viewerInstitutionId), // Never surface viewer accounts
      sql`lower(coalesce(${userProfiles.datingPreferences}->>'isEnabled', 'true')) <> 'false'`, // Only users who haven't paused/opted-out
      excludedIds.length > 0 ? notInArray(userProfiles.id, excludedIds) : undefined,
    ];

    if (collegeFilter === "CAMPUS" && profile.institutionId) {
      conditions.push(eq(userProfiles.institutionId, profile.institutionId));
    } else if (targetInstitutionId && targetInstitutionId !== "ALL") {
      conditions.push(eq(userProfiles.institutionId, targetInstitutionId));
    }

    if (genderFilter === "MALE" || genderFilter === "FEMALE") {
      conditions.push(eq(userProfiles.gender, genderFilter));
    }

    const fetchedCandidates = await db.query.userProfiles.findMany({
      where: and(...conditions.filter((c): c is SQL => c !== undefined)),
      orderBy: (table, { desc }) => [sql`${table.lastSeenAt} desc nulls last`, desc(table.updatedAt), desc(table.points)],
      limit: 200,
      with: {
        institution: true,
      },
    });

    // Only people whose own preferences would also show them me.
    const rawCandidates = fetchedCandidates.filter((cand) =>
      isMutualGenderMatch({ gender: profile.gender, preferredGender: genderFilter }, cand)
    );

    // Two-sided market stats for reciprocal ranking: how often each candidate
    // likes others, and how much attention they already receive.
    const marketStats = new Map<string, CandidateMarketStats>();
    const candidateIds = rawCandidates.map((c) => c.id);
    if (candidateIds.length > 0) {
      try {
        const [given, received] = await Promise.all([
          db
            .select({
              id: swipes.swiperId,
              likes: sql<number>`count(*) filter (where ${swipes.direction} = 'LIKE')::int`,
              total: sql<number>`count(*)::int`,
            })
            .from(swipes)
            .where(inArray(swipes.swiperId, candidateIds))
            .groupBy(swipes.swiperId),
          db
            .select({
              id: swipes.targetId,
              likes: sql<number>`count(*) filter (where ${swipes.direction} = 'LIKE')::int`,
              total: sql<number>`count(*)::int`,
            })
            .from(swipes)
            .where(inArray(swipes.targetId, candidateIds))
            .groupBy(swipes.targetId),
        ]);
        const blank = (): CandidateMarketStats => ({
          likesGiven: 0,
          swipesGiven: 0,
          likesReceived: 0,
          swipesReceived: 0,
        });
        for (const r of given) {
          const st = marketStats.get(r.id) ?? blank();
          st.likesGiven = Number(r.likes);
          st.swipesGiven = Number(r.total);
          marketStats.set(r.id, st);
        }
        for (const r of received) {
          const st = marketStats.get(r.id) ?? blank();
          st.likesReceived = Number(r.likes);
          st.swipesReceived = Number(r.total);
          marketStats.set(r.id, st);
        }
      } catch (err) {
        console.warn("[dating] market stats unavailable, ranking on compatibility only:", err);
      }
    }

    const isDicebear = (url?: string | null) => !url || url.includes("dicebear.com");

    const processedCandidates = rawCandidates.map((cand) => {
      const fallbackSet = getDatingCandidatePhotoSet(cand.gender, cand.id || cand.username);
      const validPhotos = (cand.photos || []).filter((p) => !isDicebear(p));
      const candPhotos = validPhotos.length > 0 ? validPhotos : fallbackSet.photos;
      const candAvatar =
        cand.avatarUrl && !cand.avatarUrl.includes("unsplash.com") && !isDicebear(cand.avatarUrl)
          ? cand.avatarUrl
          : fallbackSet.avatar;

      return {
        id: cand.id,
        institutionId: cand.institutionId,
        displayName: cand.displayName,
        username: cand.username,
        avatarUrl: candAvatar,
        photos: candPhotos,
        bio: cand.bio,
        gender: cand.gender,
        course: cand.course,
        branch: cand.branch,
        year: cand.year,
        points: cand.points,
        interests: cand.interests ?? [],
        institution: cand.institution
          ? { name: cand.institution.name, slug: cand.institution.slug, state: cand.institution.state }
          : null,
        createdAt: cand.createdAt,
        lastSeenAt: cand.lastSeenAt,
      };
    });

    // Dynamic session seed rotates exploration every 20 minutes so repeat visits explore new students
    const sessionSeed = Math.floor(Date.now() / (1000 * 60 * 20));

    const ranked = rankDatingCandidates(profile, processedCandidates, {
      likedMeIds,
      marketStats,
      sessionSeed,
      sort,
      limit: 25,
    });

    const formattedCandidates = ranked.map(({ candidate, score, sharedInterests, likedYou }) => ({
      id: candidate.id,
      displayName: candidate.displayName,
      username: candidate.username,
      avatarUrl: candidate.avatarUrl,
      photos: candidate.photos,
      bio: candidate.bio,
      gender: candidate.gender,
      course: candidate.course,
      branch: candidate.branch,
      year: candidate.year,
      points: candidate.points,
      interests: candidate.interests,
      institution: candidate.institution,
      createdAt: candidate.createdAt,
      compatibilityScore: score,
      sharedInterests,
      likedYou,
    }));

    // Likes still waiting for an answer (they liked me, I haven't swiped back)
    const swipedSet = new Set(swipedIds);
    const pendingLikes = [...likedMeIds].filter((id) => !swipedSet.has(id)).length;

    return NextResponse.json({
      candidates: formattedCandidates,
      meta: {
        showingGender: genderFilter,
        likesYouCount: pendingLikes,
        isMatchingEnabled,
      },
    });
  } catch (error) {
    console.error("Error fetching dating candidates:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
