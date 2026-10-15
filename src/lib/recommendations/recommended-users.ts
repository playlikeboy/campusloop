import { and, desc, eq, inArray, ne, notInArray, type SQL, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { follows, userProfiles } from "@/db/schema";
import { sharedInterestsBetween } from "@/lib/dating";
import { qdrant } from "@/lib/qdrant/client";
import { COLLECTIONS } from "@/lib/qdrant/collections";
import { generateEmbedding } from "@/lib/qdrant/embeddings";
import type { ProfileVectorPayload } from "@/lib/qdrant/types";
import { getViewerAffinity } from "@/lib/recommendations/viewer-affinity";
import { getViewerInstitutionId } from "@/lib/viewer";
import { getShowSeededPosts } from "@/lib/platform-config";

export interface RecommendedUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  branch: string | null;
  year: number | null;
  points: number;
  institution: {
    name: string;
    slug: string;
  } | null;
  vibeScore: number;
  matchReason: string;
  isFollowing?: boolean;
}

export function formatBranchShort(branch: string): string {
  const b = branch.trim().toLowerCase();
  if (b.includes("computer science") || b === "cse" || b.includes("cs")) return "CSE";
  if (b.includes("information tech") || b === "it") return "IT";
  if ((b.includes("electronics") && b.includes("communication")) || b === "ece") return "ECE";
  if (b.includes("electrical") || b === "eee" || b === "ee") return "EE";
  if (b.includes("mechanical") || b === "me") return "Mech";
  if (b.includes("civil") || b === "ce") return "Civil";
  if (b.includes("chemical") || b === "che") return "Chem";
  if (b.includes("biotechnology") || b.includes("biotech")) return "Biotech";
  if (b.includes("artificial intelligence") || b.includes("ai")) return "AI/ML";
  if (b.includes("data science") || b === "ds") return "Data Sci";
  if (b.includes("aerospace")) return "Aero";
  if (b.includes("production")) return "Prod";
  if (branch.length > 12) return `${branch.slice(0, 10).toUpperCase()}…`;
  return branch.toUpperCase();
}

/**
 * Recommends student profiles tailored to the viewer using:
 * 1. Qdrant Cloud Vector embeddings (semantic vibe similarity from bio & interests).
 * 2. Relational signals (shared campus, mutual academic branch, shared interests).
 * 3. Triadic closure ("People You May Know"): mutual connections via followed users.
 * 4. Implicit interest: authors the viewer upvotes/replies to but doesn't follow yet.
 * 5. 100% resilient fallback to active campus/global students when vector DB is unreachable.
 */

/** Score bonus for N mutual connections: diminishing returns, capped at +30. */
export function mutualConnectionBonus(mutualCount: number): number {
  if (mutualCount <= 0) return 0;
  return Math.min(30, Math.round(10 * Math.log2(1 + mutualCount)));
}
export async function getRecommendedUsers(
  viewerId: string,
  options: {
    limit?: number;
    scope?: "CAMPUS" | "GLOBAL";
  } = {}
): Promise<RecommendedUser[]> {
  const limit = options.limit ?? 6;
  const db = getDb();

  // 1. Fetch viewer profile and existing follows
  const [viewer, existingFollows] = await Promise.all([
    db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, viewerId),
      with: { institution: true },
    }),
    db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, viewerId)),
  ]);

  if (!viewer) return [];

  const followedIds = new Set(existingFollows.map((f) => f.followingId));
  const affinity = await getViewerAffinity(viewer.id);
  const excludedIds = [viewer.id, ...Array.from(followedIds), ...affinity.blockedUserIds];
  const engagedNotFollowed = affinity.engagedAuthorIds.filter(
    (id) => !followedIds.has(id) && !excludedIds.includes(id)
  );

  // Friends-of-friends: people followed by the people I follow, counted by distinct connector.
  const mutualCounts = new Map<string, number>();
  if (followedIds.size > 0) {
    try {
      const fof = await db
        .select({ id: follows.followingId, n: sql<number>`count(distinct ${follows.followerId})::int` })
        .from(follows)
        .where(
          and(
            inArray(follows.followerId, Array.from(followedIds).slice(0, 300)),
            notInArray(follows.followingId, excludedIds)
          )
        )
        .groupBy(follows.followingId)
        .orderBy(desc(sql`count(distinct ${follows.followerId})`))
        .limit(40);
      for (const row of fof) mutualCounts.set(row.id, Number(row.n));
    } catch (err) {
      console.warn("[Recommended Users] friends-of-friends lookup failed:", err);
    }
  }
  const viewerInstitutionId = await getViewerInstitutionId();

  const vectorScoreMap = new Map<string, number>();

  // 2. Attempt Qdrant Semantic Vector Retrieval
  try {
    const profileText = [
      viewer.bio || "",
      (viewer.interests || []).join(" "),
      viewer.branch || "",
      viewer.course || "",
    ]
      .filter(Boolean)
      .join(" ");

    if (profileText.trim().length > 0) {
      const queryVector = await generateEmbedding(profileText);
      const hits = await qdrant.search<ProfileVectorPayload>(COLLECTIONS.DATING_PROFILES, queryVector, {
        limit: 30,
        scoreThreshold: 0.08,
      });

      for (const hit of hits) {
        const id = String(hit.id);
        if (!excludedIds.includes(id)) {
          vectorScoreMap.set(id, hit.score);
        }
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[Recommended Users] Qdrant vector search failed, falling back to Postgres:", err);
    }
  }

  // 3. Query un-followed active candidate students from Postgres
  const showSeeded = await getShowSeededPosts();
  const conditions: (SQL | undefined)[] = [
    ne(userProfiles.id, viewer.id),
    eq(userProfiles.status, "ACTIVE"),
    ...(showSeeded ? [] : [eq(userProfiles.isSeeded, false)]),
    ne(userProfiles.institutionId, viewerInstitutionId),
  ];

  if (excludedIds.length > 0) {
    conditions.push(notInArray(userProfiles.id, excludedIds));
  }

  if (options.scope === "CAMPUS" && viewer.institutionId) {
    conditions.push(eq(userProfiles.institutionId, viewer.institutionId));
  }

  const baseWhere = and(...conditions.filter((c): c is SQL => c !== undefined));
  // Graph and implicit-interest candidates are fetched explicitly so they aren't
  // lost behind the "recently updated" window of the general pool.
  const graphIds = [...new Set([...mutualCounts.keys(), ...engagedNotFollowed])];
  const [generalRows, graphRows] = await Promise.all([
    db.query.userProfiles.findMany({
      where: baseWhere,
      orderBy: (table, { desc }) => [desc(table.updatedAt), desc(table.points)],
      limit: 60,
      with: { institution: true },
    }),
    graphIds.length > 0
      ? db.query.userProfiles.findMany({
          where: and(baseWhere, inArray(userProfiles.id, graphIds)),
          limit: 60,
          with: { institution: true },
        })
      : Promise.resolve([]),
  ]);
  const candidateRows = [...new Map([...graphRows, ...generalRows].map((r) => [r.id, r])).values()];
  const engagedSet = new Set(engagedNotFollowed);

  if (candidateRows.length === 0) {
    return [];
  }

  // 4. Multi-Factor Scoring
  const scored = candidateRows.map((cand) => {
    let score = 40;
    const sharedInterests = sharedInterestsBetween(viewer as any, cand as any);
    score += Math.min(sharedInterests.length * 10, 25);

    const vectorSim = vectorScoreMap.get(cand.id);
    if (typeof vectorSim === "number" && vectorSim > 0) {
      score += Math.min(Math.round(vectorSim * 30), 30);
    }

    const sameCampus =
      viewer.institutionId && cand.institutionId && viewer.institutionId === cand.institutionId;
    if (sameCampus) {
      score += 15;
    }

    const sameBranch =
      viewer.branch && cand.branch && viewer.branch.trim().toLowerCase() === cand.branch.trim().toLowerCase();
    if (sameBranch) {
      score += 8;
    }

    if ((cand.points || 0) > 100) {
      score += 5;
    }

    const mutuals = mutualCounts.get(cand.id) || 0;
    score += mutualConnectionBonus(mutuals);

    // You already upvote/reply to them: the strongest follow predictor we have.
    const engaged = engagedSet.has(cand.id);
    if (engaged) score += 25;

    const clampedScore = Math.max(35, Math.min(99, score));

    // Determine intuitive match reason badge
    let matchReason = "Active";
    if (engaged) {
      matchReason = "You Engage";
    } else if (mutuals >= 2) {
      matchReason = `${mutuals} Mutuals`;
    } else if (vectorSim && vectorSim >= 0.5) {
      matchReason = `${clampedScore}% Match`;
    } else if (sameCampus) {
      matchReason = "Same Campus";
    } else if (sameBranch && cand.branch) {
      matchReason = formatBranchShort(cand.branch);
    } else if (sharedInterests.length > 0) {
      const interest = sharedInterests[0];
      matchReason = interest.length > 12 ? `${interest.slice(0, 10)}…` : interest;
    } else if (clampedScore >= 65) {
      matchReason = `${clampedScore}% Vibe`;
    }

    return {
      id: cand.id,
      displayName: cand.displayName,
      username: cand.username,
      avatarUrl: cand.avatarUrl,
      bio: cand.bio,
      branch: cand.branch,
      year: cand.year,
      points: cand.points || 0,
      institution: cand.institution ? { name: cand.institution.name, slug: cand.institution.slug } : null,
      vibeScore: clampedScore,
      matchReason,
      isFollowing: false,
    };
  });

  // Sort by calculated vibe score descending
  scored.sort((a, b) => b.vibeScore - a.vibeScore);

  return scored.slice(0, limit);
}
