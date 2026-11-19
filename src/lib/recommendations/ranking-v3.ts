import { and, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { follows, postEngagementStats, posts, votes } from "@/db/schema";
import { type ActiveBoost, buildBoostMultiplierSql, buildBoostTierSql } from "@/lib/feed-boosts";
import { getTypePriors } from "@/lib/recommendations/engagement-stats";
import { postHashtagsSql } from "@/lib/recommendations/interest-vector";
import { rankCandidatesV3, type V3Candidate } from "@/lib/recommendations/value-model";
import type { ViewerAffinity } from "@/lib/recommendations/viewer-affinity";

/**
 * Ranking v3 page selection.
 *
 * One query loads the candidate pool (newest N matching posts) with their
 * engagement stats, the viewer's follow edge and vote via indexed LEFT JOINs:
 * no correlated subquery per row. Scoring, traffic pools, exploration and
 * diversity then run in memory (pure, see value-model.ts).
 *
 * Throws when post_engagement_stats is missing; the caller falls back to v2.
 */
export async function selectV3PageIds(options: {
  base: SQL | undefined;
  poolSize: number;
  offset: number;
  limit: number;
  boosts: ActiveBoost[];
  viewerProfileId?: string | null;
  viewerInstitutionId?: string | null;
  affinity?: ViewerAffinity | null;
  mode: "feed" | "reels";
}): Promise<string[]> {
  const db = getDb();
  const viewer = options.viewerProfileId ?? "";
  const tierSql = buildBoostTierSql(options.boosts) ?? sql<number>`1`;
  const multSql = buildBoostMultiplierSql(options.boosts) ?? sql<number>`1`;

  const select = () =>
    db
      .select({
        id: posts.id,
        type: posts.type,
        authorId: posts.authorId,
        isAnonymous: posts.isAnonymous,
        institutionId: posts.institutionId,
        communityId: posts.communityId,
        createdAt: posts.createdAt,
        hashtags: postHashtagsSql,
        impressions: postEngagementStats.impressions,
        dwellMsSum: postEngagementStats.dwellMsSum,
        longDwell: postEngagementStats.longDwell,
        skips: postEngagementStats.skips,
        votes: postEngagementStats.votes,
        comments: postEngagementStats.comments,
        shares: postEngagementStats.shares,
        saves: postEngagementStats.saves,
        profileTaps: postEngagementStats.profileTaps,
        reports: postEngagementStats.reports,
        completions: postEngagementStats.completions,
        loops: postEngagementStats.loops,
        followMutual: follows.isMutual,
        viewerVote: votes.value,
        boostTier: sql<number>`(${tierSql})::float8`,
        boostMultiplier: sql<number>`(${multSql})::float8`,
      })
      .from(posts)
      .leftJoin(postEngagementStats, eq(postEngagementStats.postId, posts.id))
      .leftJoin(follows, and(eq(follows.followerId, viewer), eq(follows.followingId, posts.authorId)))
      .leftJoin(votes, and(eq(votes.postId, posts.id), eq(votes.userId, viewer)));

  const boostedPostIds = options.boosts
    .filter((b) => b.targetType === "POST" && /^[a-zA-Z0-9_-]+$/.test(b.targetId))
    .map((b) => b.targetId);

  const [recent, boosted, priors] = await Promise.all([
    select().where(options.base).orderBy(desc(posts.createdAt)).limit(options.poolSize),
    boostedPostIds.length > 0
      ? select().where(and(options.base, inArray(posts.id, boostedPostIds)))
      : Promise.resolve([]),
    getTypePriors(),
  ]);

  const byId = new Map<string, (typeof recent)[number]>();
  for (const row of [...recent, ...boosted]) byId.set(row.id, row);

  const n = (v: unknown) => Number(v) || 0;
  const candidates: V3Candidate[] = [...byId.values()].map((r) => ({
    id: r.id,
    type: r.type,
    authorId: r.authorId,
    isAnonymous: r.isAnonymous,
    institutionId: r.institutionId,
    communityId: r.communityId,
    hashtags: Array.isArray(r.hashtags) ? r.hashtags : [],
    createdAt: r.createdAt,
    counts: {
      impressions: n(r.impressions),
      dwellMsSum: n(r.dwellMsSum),
      longDwell: n(r.longDwell),
      skips: n(r.skips),
      votes: n(r.votes),
      comments: n(r.comments),
      shares: n(r.shares),
      saves: n(r.saves),
      profileTaps: n(r.profileTaps),
      reports: n(r.reports),
      completions: n(r.completions),
      loops: n(r.loops),
    },
    follow: r.followMutual === null || r.followMutual === undefined ? null : r.followMutual ? "mutual" : "follow",
    viewerVoted: r.viewerVote !== null && r.viewerVote !== undefined,
    // BURY is tier 0, so only a non-number falls back to organic.
    boostTier: Number.isFinite(Number(r.boostTier)) ? Number(r.boostTier) : 1,
    boostMultiplier: Number(r.boostMultiplier) || 1,
  }));

  const ranked = rankCandidatesV3(
    candidates,
    {
      viewerProfileId: options.viewerProfileId,
      viewerInstitutionId: options.viewerInstitutionId,
      nearbyInstitutionIds: options.affinity?.nearbyInstitutionIds ?? [],
      interest: options.affinity?.interest ?? null,
      priors,
      mode: options.mode,
    },
    options.offset + options.limit
  );

  return ranked.slice(options.offset, options.offset + options.limit).map((c) => c.id);
}
