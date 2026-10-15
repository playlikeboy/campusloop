import { sql, type SQL } from "drizzle-orm";
import { comments, follows, posts, reports, votes } from "@/db/schema";
import type { ViewerAffinity } from "@/lib/recommendations/viewer-affinity";

/**
 * 🐦 Phoenix Multi-Action Ranking & Explicit Value Function
 * Inspired by xAI / X's 2026 public recommendation architecture (`phoenix/` and `home-mixer/`).
 *
 * Rather than a naive single scalar score, ranking separates:
 * 1. Multi-Action Prediction: P(like), P(reply), P(repost), P(share), P(save), P(follow), P(dwell), P(report)...
 * 2. Explicit Value Function: Linear combination of predictions weighted by community utility.
 * 3. Author / Community Diversity: Non-linear decay on author and category concentration.
 * 4. New-Author Cold Start Boost: Guaranteed exploration budget for new creators and student clubs.
 */

export interface PhoenixActionProbabilities {
  pLike: number;
  pComment: number; // Conversation velocity
  pRepost: number;
  pShare: number;
  pSave: number;
  pFollowAuthor: number;
  pEventRsvp: number;
  pClubJoin: number;
  pLongDwell: number; // Dwell > 2 min
  pHide?: number;
  pMuteAuthor?: number;
  pReport?: number;
}

export interface PhoenixWeights {
  like: number;
  comment: number;
  repost: number;
  share: number;
  save: number;
  follow: number;
  eventRsvp: number;
  clubJoin: number;
  dwell: number;
  hide: number;
  mute: number;
  report: number;
}

/**
 * CampusLoop Default Production Value Function Weights.
 * In line with X's Home Mixer weights, high-intent conversation (comments/replies),
 * active shares, and campus community actions (event RSVPs, club joins) are weighted
 * significantly higher than passive single-click likes.
 */
export const DEFAULT_PHOENIX_WEIGHTS: PhoenixWeights = {
  like: 0.5,
  comment: 5.0, // High conversation multiplier (X home-mixer standard: 5.0)
  repost: 1.0,
  share: 4.0, // Active sharing via link/DM
  save: 5.0, // High-value retention signal
  follow: 4.0, // Author discovery & affinity
  eventRsvp: 8.0, // Campus utility
  clubJoin: 7.0, // Campus community discovery
  dwell: 0.05, // Reading engagement
  hide: -12.0, // Negative feedback
  mute: -25.0, // Author mute penalty
  report: -80.0, // Severe violation penalty
} as const;

/**
 * Compute the explicit value function score for a candidate post.
 */
export function computePhoenixValueScore(
  probs: PhoenixActionProbabilities,
  weights: PhoenixWeights = DEFAULT_PHOENIX_WEIGHTS
): number {
  return (
    (probs.pLike || 0) * weights.like +
    (probs.pComment || 0) * weights.comment +
    (probs.pRepost || 0) * weights.repost +
    (probs.pShare || 0) * weights.share +
    (probs.pSave || 0) * weights.save +
    (probs.pFollowAuthor || 0) * weights.follow +
    (probs.pEventRsvp || 0) * weights.eventRsvp +
    (probs.pClubJoin || 0) * weights.clubJoin +
    (probs.pLongDwell || 0) * weights.dwell +
    (probs.pHide || 0) * weights.hide +
    (probs.pMuteAuthor || 0) * weights.mute +
    (probs.pReport || 0) * weights.report
  );
}

/**
 * SQL Expression Builder for Phoenix Multi-Action Ranking.
 * Combines in-network affinity, time-decayed interaction momentum,
 * student campus proximity, cold-start exploration budget, and seen/voted demotions.
 */
export function getPhoenixValueScoreSql(
  viewerProfileId?: string | null,
  userInstitutionId?: string | null,
  seenIds?: string[],
  affinity?: ViewerAffinity | null
): SQL<number> {
  const hoursSinceSql = sql<number>`(extract(epoch from (now() - ${posts.createdAt})) / 3600.0)`;

  // In-network and mutual social graph multiplier (Thunder / RealGraph)
  const networkAffinitySql = viewerProfileId
    ? sql<number>`(case 
        when exists(
          select 1 from ${follows} 
          where ${follows.followerId} = ${viewerProfileId} 
            and ${follows.followingId} = ${posts.authorId} 
            and ${follows.isMutual} = true
        ) then 1.75
        when exists(
          select 1 from ${follows} 
          where ${follows.followerId} = ${viewerProfileId} 
            and ${follows.followingId} = ${posts.authorId}
        ) then 1.40
        else 1.00
      end)`
    : sql<number>`1.00`;

  // Campus Proximity Multiplier (1.45 for same campus)
  const campusAffinityBonus = userInstitutionId
    ? sql<number>`(case when ${posts.institutionId} = ${userInstitutionId} then 45.0 else 0.0 end)`
    : sql<number>`0.0`;

  // Interaction Momentum
  const recentVotesSql = sql<number>`coalesce((select sum(${votes.value})::numeric from ${votes} where ${votes.postId} = "posts"."id" and ${votes.createdAt} > now() - interval '24 hours'), 0.0)`;
  const recentCommentsSql = sql<number>`coalesce((select count(*)::numeric from ${comments} where ${comments.postId} = "posts"."id" and ${comments.status} = 'PUBLISHED' and ${comments.createdAt} > now() - interval '24 hours'), 0.0)`;
  const totalReportsSql = sql<number>`coalesce((select count(*)::numeric from ${reports} where ${reports.targetType} = 'POST' and ${reports.targetId} = "posts"."id"), 0.0)`;

  // Multi-Action weighted engagement:
  // Comments weighted at 5.0 (conversation), Votes at 1.5, Reports heavily penalized at -40.0
  const actionValueSql = sql<number>`(
    (${recentVotesSql} * 1.5::numeric) +
    (${recentCommentsSql} * 5.0::numeric) -
    (${totalReportsSql} * 40.0::numeric)
  )`;

  // Time Gravity Decay (Hacker News / Phoenix logarithmic decay curve)
  const timeDecayCurve = sql<number>`(75.0 / power(${hoursSinceSql} + 1.2, 0.78))`;

  // New-Author / Cold-Start Exploration Budget (X New-Author Boost):
  // Gives new authors with <= 5 posts a temporary distribution boost to discover their initial campus audience
  const newAuthorExplorationBoostSql = sql<number>`(case 
    when ${posts.authorId} is not null and (select count(*)::int from "posts" p2 where p2.author_id = ${posts.authorId}) <= 5 
    then 18.0 
    else 0.0 
  end)`;

  // Content type intrinsic conversational multipliers
  const typeBonusSql = sql<number>`(case 
    when ${posts.type} = 'POLL' then 12.0
    when ${posts.type} = 'QUESTION' then 10.0
    when ${posts.type} = 'CONFESSION' then 8.0
    when ${posts.type} = 'MEME' then 6.0
    else 0.0 
  end)`;

  // Learned topic affinity: the viewer's 30-day engagement share per post type
  // (0..1) scaled to at most +40, so a viewer who mostly replies to polls sees more polls.
  const typeEntries = Object.entries(affinity?.typeAffinity ?? {}).filter(
    ([type, share]) => /^[A-Z_]+$/.test(type) && Number.isFinite(share) && share > 0
  );
  const typeAffinitySql =
    typeEntries.length > 0
      ? sql<number>`(case ${sql.join(
          typeEntries.map(
            ([type, share]) => sql`when ${posts.type} = ${type} then ${sql.raw((share * 40).toFixed(2))}`
          ),
          sql` `
        )} else 0.0 end)`
      : sql<number>`0.0`;

  // RealGraph-lite: authors the viewer repeatedly engages with, followed or not.
  const engagedAuthors = (affinity?.engagedAuthorIds ?? []).filter((id) => /^[a-zA-Z0-9_-]+$/.test(id));
  const engagedAuthorMultiplierSql =
    engagedAuthors.length > 0
      ? sql<number>`(case when ${posts.authorId} in (${sql.join(
          engagedAuthors.map((id) => sql`${id}`),
          sql`, `
        )}) and ${posts.isAnonymous} = false then 1.30 else 1.00 end)`
      : sql<number>`1.00`;

  // Fresh-post exploration (Thompson-style optimism under uncertainty): posts under
  // 3 hours old have almost no engagement data yet, so give them a decaying prior
  // instead of letting early leaders lock in the top slots.
  const freshExplorationSql = sql<number>`(case when ${hoursSinceSql} < 3 then (3 - ${hoursSinceSql}) * 6.0 else 0.0 end)`;

  // Penalties: Already seen (-160), already voted (-55), own post (-25)
  const safeSeenIds = (seenIds || [])
    .slice(0, 100)
    .filter((id): id is string => typeof id === "string" && /^[a-zA-Z0-9_-]+$/.test(id));

  const seenPenaltySql =
    safeSeenIds.length > 0
      ? sql<number>`(case when ${posts.id} in (${sql.join(
          safeSeenIds.map((id) => sql`${id}`),
          sql`, `
        )}) then -160.0 else 0.0 end)`
      : sql<number>`0.0`;

  const alreadyVotedPenaltySql = viewerProfileId
    ? sql<number>`(case when exists(select 1 from ${votes} where ${votes.postId} = "posts"."id" and ${votes.userId} = ${viewerProfileId}) then -55.0 else 0.0 end)`
    : sql<number>`0.0`;

  const ownPostPenaltySql = viewerProfileId
    ? sql<number>`(case when ${posts.authorId} = ${viewerProfileId} then -25.0 else 0.0 end)`
    : sql<number>`0.0`;

  return sql<number>`(
    (
      (${timeDecayCurve} + ${actionValueSql} + ${campusAffinityBonus} + ${typeBonusSql} + ${newAuthorExplorationBoostSql} + ${typeAffinitySql} + ${freshExplorationSql})
      * ${networkAffinitySql}
      * ${engagedAuthorMultiplierSql}
    )
    + ${seenPenaltySql}
    + ${alreadyVotedPenaltySql}
    + ${ownPostPenaltySql}
  )`;
}
