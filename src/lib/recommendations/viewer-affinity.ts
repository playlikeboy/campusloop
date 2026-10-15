import { and, desc, eq, gt, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { blocks, comments, posts, votes } from "@/db/schema";
import { getRedis } from "@/lib/redis";

/**
 * Viewer affinity profile for the For You ranker.
 *
 * Two learned signals plus a hard safety filter, computed from the viewer's
 * last 30 days of explicit engagement:
 * - typeAffinity: share of engagement per post type (confession/poll/meme...),
 *   the "topic" half of SimClusters reduced to what our schema knows.
 * - engagedAuthorIds: authors the viewer keeps upvoting/replying to without
 *   necessarily following them (RealGraph-lite).
 * - blockedUserIds: both directions of a block; never ranked, only removed.
 *
 * Cached in Redis for 10 minutes. Any failure returns an empty profile so the
 * feed degrades to the unpersonalised Phoenix score.
 */
export interface ViewerAffinity {
  typeAffinity: Record<string, number>;
  engagedAuthorIds: string[];
  blockedUserIds: string[];
}

export const EMPTY_AFFINITY: ViewerAffinity = { typeAffinity: {}, engagedAuthorIds: [], blockedUserIds: [] };

const CACHE_TTL_SECONDS = 600;
const SAFE_ID = /^[a-zA-Z0-9_-]+$/;

/** Turn raw per-type engagement counts into shares that sum to 1. */
export function normalizeTypeCounts(counts: Record<string, number>): Record<string, number> {
  const total = Object.values(counts).reduce((a, b) => a + Math.max(0, b), 0);
  if (total <= 0) return {};
  const out: Record<string, number> = {};
  for (const [type, count] of Object.entries(counts)) {
    if (count > 0) out[type] = count / total;
  }
  return out;
}

export async function getViewerAffinity(viewerProfileId?: string | null): Promise<ViewerAffinity> {
  if (!viewerProfileId) return EMPTY_AFFINITY;
  const cacheKey = `feed:affinity:${viewerProfileId}`;

  try {
    const cached = await getRedis()?.get<ViewerAffinity>(cacheKey);
    if (cached && typeof cached === "object" && cached.typeAffinity) return cached;
  } catch {
    // Cache miss path below
  }

  try {
    const db = getDb();
    const since = sql`now() - interval '30 days'`;

    const [voteTypes, commentTypes, voteAuthors, commentAuthors, blockRows] = await Promise.all([
      db
        .select({ type: posts.type, n: sql<number>`count(*)::int` })
        .from(votes)
        .innerJoin(posts, eq(votes.postId, posts.id))
        .where(and(eq(votes.userId, viewerProfileId), eq(votes.value, 1), gt(votes.createdAt, since)))
        .groupBy(posts.type),
      db
        .select({ type: posts.type, n: sql<number>`count(*)::int` })
        .from(comments)
        .innerJoin(posts, eq(comments.postId, posts.id))
        .where(and(eq(comments.authorId, viewerProfileId), gt(comments.createdAt, since)))
        .groupBy(posts.type),
      db
        .select({ authorId: posts.authorId, n: sql<number>`count(*)::int` })
        .from(votes)
        .innerJoin(posts, eq(votes.postId, posts.id))
        .where(
          and(
            eq(votes.userId, viewerProfileId),
            eq(votes.value, 1),
            eq(posts.isAnonymous, false),
            gt(votes.createdAt, since)
          )
        )
        .groupBy(posts.authorId)
        .orderBy(desc(sql`count(*)`))
        .limit(25),
      db
        .select({ authorId: posts.authorId, n: sql<number>`count(*)::int` })
        .from(comments)
        .innerJoin(posts, eq(comments.postId, posts.id))
        .where(
          and(
            eq(comments.authorId, viewerProfileId),
            eq(posts.isAnonymous, false),
            gt(comments.createdAt, since)
          )
        )
        .groupBy(posts.authorId)
        .orderBy(desc(sql`count(*)`))
        .limit(25),
      db
        .select({ blockerId: blocks.blockerId, blockedUserId: blocks.blockedUserId })
        .from(blocks)
        .where(or(eq(blocks.blockerId, viewerProfileId), eq(blocks.blockedUserId, viewerProfileId))),
    ]);

    // A reply is a stronger signal than an upvote (X weights replies ~10x likes; we use 3x).
    const typeCounts: Record<string, number> = {};
    for (const r of voteTypes) typeCounts[r.type] = (typeCounts[r.type] || 0) + Number(r.n);
    for (const r of commentTypes) typeCounts[r.type] = (typeCounts[r.type] || 0) + Number(r.n) * 3;

    const authorScores = new Map<string, number>();
    for (const r of voteAuthors) {
      if (r.authorId) authorScores.set(r.authorId, (authorScores.get(r.authorId) || 0) + Number(r.n));
    }
    for (const r of commentAuthors) {
      if (r.authorId) authorScores.set(r.authorId, (authorScores.get(r.authorId) || 0) + Number(r.n) * 3);
    }

    const affinity: ViewerAffinity = {
      typeAffinity: normalizeTypeCounts(typeCounts),
      engagedAuthorIds: [...authorScores.entries()]
        .filter(([id, score]) => id !== viewerProfileId && score >= 2 && SAFE_ID.test(id))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([id]) => id),
      blockedUserIds: [
        ...new Set(
          blockRows.map((b) => (b.blockerId === viewerProfileId ? b.blockedUserId : b.blockerId))
        ),
      ].filter((id) => SAFE_ID.test(id)),
    };

    try {
      await getRedis()?.set(cacheKey, affinity, { ex: CACHE_TTL_SECONDS });
    } catch {
      // Non-fatal
    }
    return affinity;
  } catch (err) {
    console.warn("[viewer-affinity] falling back to empty profile:", err);
    return EMPTY_AFFINITY;
  }
}

/** Drop the cached profile, e.g. right after the viewer blocks someone. */
export async function invalidateViewerAffinity(viewerProfileId: string): Promise<void> {
  try {
    await getRedis()?.del(`feed:affinity:${viewerProfileId}`);
  } catch {
    // Non-fatal
  }
}
