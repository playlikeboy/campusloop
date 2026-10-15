import { and, desc, eq, gt, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { blocks, comments, posts, userBehaviorEvents, votes } from "@/db/schema";
import { getRedis } from "@/lib/redis";
import { bayesianRate } from "@/lib/recommendations/scoring-primitives";

/**
 * Viewer affinity profile for the For You ranker.
 *
 * Two learned signals plus a hard safety filter, computed from the viewer's
 * last 30 days of explicit engagement:
 * - typeAffinity: share of engagement per post type (confession/poll/meme...),
 *   the "topic" half of SimClusters reduced to what our schema knows.
 * - engagedAuthorIds: authors the viewer keeps upvoting/replying to without
 *   necessarily following them (RealGraph-lite).
 * - typeSkipPenalty / skippedAuthorIds: from feed impressions (POST_DWELL), what
 *   the viewer scrolls straight past without voting. Implicit negative feedback,
 *   like X's "not interested" and TikTok's quick-swipe signal.
 * - blockedUserIds: both directions of a block; never ranked, only removed.
 *
 * Cached in Redis for 10 minutes. Any failure returns an empty profile so the
 * feed degrades to the unpersonalised Phoenix score.
 */
export interface ViewerAffinity {
  typeAffinity: Record<string, number>;
  engagedAuthorIds: string[];
  /** 0..1 per post type; how much more than average the viewer skips this type. */
  typeSkipPenalty: Record<string, number>;
  /** Authors the viewer has repeatedly scrolled past. */
  skippedAuthorIds: string[];
  blockedUserIds: string[];
}

export const EMPTY_AFFINITY: ViewerAffinity = {
  typeAffinity: {},
  engagedAuthorIds: [],
  typeSkipPenalty: {},
  skippedAuthorIds: [],
  blockedUserIds: [],
};

/** Viewed for less than this without a vote = scrolled past. */
export const SKIP_DWELL_MS = 1200;
/** Baseline skip rate on a feed; most posts are scrolled past. */
const SKIP_PRIOR = 0.55;

/**
 * Skip penalty per type: Bayesian-smoothed skip rate above the prior, scaled to 0..1.
 * Needs a decent sample before it moves: 20 pseudo-impressions of prior weight.
 */
export function computeTypeSkipPenalty(
  stats: Record<string, { skips: number; total: number }>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [type, { skips, total }] of Object.entries(stats)) {
    const rate = bayesianRate(skips, total, SKIP_PRIOR, 20);
    const penalty = (rate - SKIP_PRIOR) / (1 - SKIP_PRIOR);
    if (penalty > 0.05) out[type] = Math.min(1, Number(penalty.toFixed(3)));
  }
  return out;
}

/** Authors with at least 4 impressions whose smoothed skip rate is >= 85%. */
export function pickSkippedAuthors(
  stats: Map<string, { skips: number; total: number }>,
  exclude: Set<string>
): string[] {
  return [...stats.entries()]
    .filter(
      ([id, { skips, total }]) =>
        !exclude.has(id) && SAFE_ID.test(id) && total >= 4 && bayesianRate(skips, total, SKIP_PRIOR, 4) >= 0.85
    )
    .sort((a, b) => b[1].skips - a[1].skips)
    .slice(0, 30)
    .map(([id]) => id);
}

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
  const cacheKey = `feed:affinity:v2:${viewerProfileId}`;

  try {
    const cached = await getRedis()?.get<ViewerAffinity>(cacheKey);
    // Older cache entries predate skip learning; merge onto the empty shape.
    if (cached && typeof cached === "object" && cached.typeAffinity) return { ...EMPTY_AFFINITY, ...cached };
  } catch {
    // Cache miss path below
  }

  try {
    const db = getDb();
    const since = sql`now() - interval '30 days'`;

    // A skip is a short impression on a post the viewer didn't vote on.
    const dwellMsSql = sql<number>`coalesce((${userBehaviorEvents.metadata}->>'dwellMs')::int, 0)`;
    const isSkipSql = sql`(${dwellMsSql} < ${SKIP_DWELL_MS} and not exists (
      select 1 from ${votes} where ${votes.postId} = ${userBehaviorEvents.targetId} and ${votes.userId} = ${viewerProfileId}
    ))`;
    const impressionWhere = and(
      eq(userBehaviorEvents.userId, viewerProfileId),
      eq(userBehaviorEvents.eventType, "POST_DWELL"),
      eq(userBehaviorEvents.targetType, "POST"),
      gt(userBehaviorEvents.createdAt, sql`now() - interval '14 days'`)
    );

    const [voteTypes, commentTypes, voteAuthors, commentAuthors, blockRows, skipTypes, skipAuthors] =
      await Promise.all([
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
      db
        .select({
          type: sql<string>`${userBehaviorEvents.metadata}->>'postType'`,
          skips: sql<number>`count(*) filter (where ${isSkipSql})::int`,
          total: sql<number>`count(*)::int`,
        })
        .from(userBehaviorEvents)
        .where(impressionWhere)
        .groupBy(sql`${userBehaviorEvents.metadata}->>'postType'`),
      db
        .select({
          authorId: sql<string>`${userBehaviorEvents.metadata}->>'authorId'`,
          skips: sql<number>`count(*) filter (where ${isSkipSql})::int`,
          total: sql<number>`count(*)::int`,
        })
        .from(userBehaviorEvents)
        .where(and(impressionWhere, sql`${userBehaviorEvents.metadata}->>'authorId' is not null`))
        .groupBy(sql`${userBehaviorEvents.metadata}->>'authorId'`)
        .orderBy(desc(sql`count(*)`))
        .limit(200),
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

    const engagedAuthorIds = [...authorScores.entries()]
      .filter(([id, score]) => id !== viewerProfileId && score >= 2 && SAFE_ID.test(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id]) => id);

    const typeSkipStats: Record<string, { skips: number; total: number }> = {};
    for (const r of skipTypes) {
      if (r.type && /^[A-Z_]+$/.test(r.type)) {
        typeSkipStats[r.type] = { skips: Number(r.skips), total: Number(r.total) };
      }
    }
    const authorSkipStats = new Map<string, { skips: number; total: number }>();
    for (const r of skipAuthors) {
      if (r.authorId) authorSkipStats.set(r.authorId, { skips: Number(r.skips), total: Number(r.total) });
    }

    const affinity: ViewerAffinity = {
      typeAffinity: normalizeTypeCounts(typeCounts),
      engagedAuthorIds,
      typeSkipPenalty: computeTypeSkipPenalty(typeSkipStats),
      skippedAuthorIds: pickSkippedAuthors(authorSkipStats, new Set([...engagedAuthorIds, viewerProfileId])),
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
    await getRedis()?.del(`feed:affinity:v2:${viewerProfileId}`);
  } catch {
    // Non-fatal
  }
}
