import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { comments, follows, posts, userProfiles, votes } from "@/db/schema";
import type { FeedSocialActor, FeedSocialContext, SocialActivityType } from "@/hooks/use-feed";

export interface LoadFollowedPostActivityParams {
  viewerProfileId?: string | null;
  postIds: string[];
}

/**
 * Loads aggregated social context (activity by users the viewer follows)
 * for a batch of feed post IDs in a single batched query roundtrip.
 *
 * Supported interactions:
 * - VIBE/LIKE: positive vote (value = 1)
 * - COMMENT: published, non-anonymous comment
 * - REPOST: published, non-anonymous repost
 *
 * Guarantees:
 * - 0 N+1 database queries.
 * - Strict anonymity preservation: anonymous comments/reposts are never attributed.
 * - Multi-action aggregation: multiple interactions by the same person are merged.
 * - Recency-based sorting: actors are ordered by their latest activity.
 * - Visible actors capped at 3, with totalActors reflecting full interaction count.
 */
export async function loadFollowedPostActivity({
  viewerProfileId,
  postIds,
}: LoadFollowedPostActivityParams): Promise<Map<string, FeedSocialContext>> {
  const resultMap = new Map<string, FeedSocialContext>();

  if (!viewerProfileId || !postIds || postIds.length === 0) {
    return resultMap;
  }

  // Deduplicate and sanitize post IDs
  const uniquePostIds = Array.from(new Set(postIds.filter((id): id is string => Boolean(id))));
  if (uniquePostIds.length === 0) {
    return resultMap;
  }

  const db = getDb();

  // 1. Fetch user IDs followed by the viewer
  const followedRows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, viewerProfileId));

  const followingIds = Array.from(
    new Set(followedRows.map((r) => r.followingId).filter((id): id is string => Boolean(id)))
  );

  if (followingIds.length === 0) {
    return resultMap;
  }

  // 2. Query likes, comments, and reposts in parallel constrained by postIds AND followingIds
  try {
    const [likeRows, commentRows, repostRows] = await Promise.all([
      // Likes: votes with value = 1
      db
        .select({
          postId: votes.postId,
          actorId: votes.userId,
          createdAt: votes.createdAt,
          displayName: userProfiles.displayName,
          username: userProfiles.username,
          avatarUrl: userProfiles.avatarUrl,
        })
        .from(votes)
        .innerJoin(userProfiles, eq(votes.userId, userProfiles.id))
        .where(
          and(
            inArray(votes.postId, uniquePostIds),
            inArray(votes.userId, followingIds),
            eq(votes.value, 1)
          )
        ),

      // Comments: published and non-anonymous
      db
        .select({
          postId: comments.postId,
          actorId: comments.authorId,
          createdAt: comments.createdAt,
          displayName: userProfiles.displayName,
          username: userProfiles.username,
          avatarUrl: userProfiles.avatarUrl,
        })
        .from(comments)
        .innerJoin(userProfiles, eq(comments.authorId, userProfiles.id))
        .where(
          and(
            inArray(comments.postId, uniquePostIds),
            inArray(comments.authorId, followingIds),
            eq(comments.status, "PUBLISHED"),
            eq(comments.isAnonymous, false)
          )
        ),

      // Reposts: published and non-anonymous
      db
        .select({
          postId: posts.repostOfId,
          actorId: posts.authorId,
          createdAt: posts.createdAt,
          displayName: userProfiles.displayName,
          username: userProfiles.username,
          avatarUrl: userProfiles.avatarUrl,
        })
        .from(posts)
        .innerJoin(userProfiles, eq(posts.authorId, userProfiles.id))
        .where(
          and(
            inArray(posts.repostOfId, uniquePostIds),
            inArray(posts.authorId, followingIds),
            eq(posts.status, "PUBLISHED"),
            eq(posts.isAnonymous, false)
          )
        ),
    ]);

    return aggregatePostActivities({ likeRows, commentRows, repostRows });
  } catch (error) {
    console.error("Error loading followed post activity:", error);
    return resultMap;
  }
}

export type ActivityRow = {
  postId: string | null;
  actorId: string | null;
  createdAt: Date | string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
};

interface AggregateActivitiesInput {
  likeRows?: ActivityRow[];
  commentRows?: ActivityRow[];
  repostRows?: ActivityRow[];
}

/**
 * Pure aggregation function: Groups, deduplicates, and sorts activities
 * by recency per post, capping actors at 3 with totalActors count.
 */
export function aggregatePostActivities({
  likeRows = [],
  commentRows = [],
  repostRows = [],
}: AggregateActivitiesInput): Map<string, FeedSocialContext> {
  const resultMap = new Map<string, FeedSocialContext>();

  type AggregatedActor = {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    actions: Set<SocialActivityType>;
    latestAt: Date;
  };

  const postActivityMap = new Map<string, Map<string, AggregatedActor>>();

  function recordActivity(
    postId: string | null,
    actorId: string | null,
    action: SocialActivityType,
    createdAt: Date,
    displayName: string | null,
    username: string | null,
    avatarUrl: string | null
  ) {
    if (!postId || !actorId || !username || !displayName) return;

    let actorMap = postActivityMap.get(postId);
    if (!actorMap) {
      actorMap = new Map<string, AggregatedActor>();
      postActivityMap.set(postId, actorMap);
    }

    const existing = actorMap.get(actorId);
    if (!existing) {
      actorMap.set(actorId, {
        id: actorId,
        username,
        displayName,
        avatarUrl,
        actions: new Set([action]),
        latestAt: createdAt,
      });
    } else {
      existing.actions.add(action);
      if (createdAt.getTime() > existing.latestAt.getTime()) {
        existing.latestAt = createdAt;
      }
    }
  }

  // Process likes
  for (const row of likeRows) {
    recordActivity(
      row.postId,
      row.actorId,
      "LIKE",
      new Date(row.createdAt),
      row.displayName,
      row.username,
      row.avatarUrl
    );
  }

  // Process comments
  for (const row of commentRows) {
    recordActivity(
      row.postId,
      row.actorId,
      "COMMENT",
      new Date(row.createdAt),
      row.displayName,
      row.username,
      row.avatarUrl
    );
  }

  // Process reposts
  for (const row of repostRows) {
    recordActivity(
      row.postId,
      row.actorId,
      "REPOST",
      new Date(row.createdAt),
      row.displayName,
      row.username,
      row.avatarUrl
    );
  }

  // Format and sort actors for each post by recency
  for (const [postId, actorMap] of postActivityMap.entries()) {
    const allActors = Array.from(actorMap.values()).map((a) => ({
      id: a.id,
      username: a.username,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl,
      actions: Array.from(a.actions) as SocialActivityType[],
      latestAt: a.latestAt.toISOString(),
      _latestMs: a.latestAt.getTime(),
    }));

    // Sort by latest interaction timestamp descending (most recent first)
    allActors.sort((a, b) => b._latestMs - a._latestMs);

    const totalActors = allActors.length;
    if (totalActors > 0) {
      const topActors: FeedSocialActor[] = allActors
        .slice(0, 3)
        .map(({ _latestMs, ...rest }) => rest);

      resultMap.set(postId, {
        actors: topActors,
        totalActors,
      });
    }
  }

  return resultMap;
}

