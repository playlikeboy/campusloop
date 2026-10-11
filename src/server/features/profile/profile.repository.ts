import "server-only";

import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { externalPosts, follows, posts, userProfiles } from "@/db/schema";

export function findProfileById(id: string) {
  return getDb().query.userProfiles.findFirst({
    where: eq(userProfiles.id, id),
    columns: { username: true },
  });
}

export function findOwnProfileByUserId(userId: string) {
  return getDb().query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
    with: { institution: true },
  });
}

export function findOwnProfilePosts(profileId: string) {
  return getDb().query.posts.findMany({
    where: and(
      eq(posts.authorId, profileId),
      eq(posts.status, "PUBLISHED"),
      eq(posts.isSeeded, false),
      eq(posts.isAnonymous, false),
    ),
    orderBy: [desc(posts.createdAt)],
    limit: 20,
    with: {
      author: true,
      institution: true,
      votes: true,
      comments: true,
      pollOptions: { with: { votes: true } },
    },
  });
}

export function findExternalPostsForPosts(postIds: string[]) {
  if (postIds.length === 0) return Promise.resolve([]);
  return getDb().query.externalPosts.findMany({
    where: inArray(externalPosts.postId, postIds),
    with: {
      media: {
        orderBy: (media, { asc }) => [asc(media.position)],
      },
    },
  });
}

export async function getProfileFollowCounts(profileId: string) {
  const [row] = await getDb()
    .select({
      followersCount: sql<number>`count(*) filter (where ${follows.followingId} = ${profileId})::int`,
      followingCount: sql<number>`count(*) filter (where ${follows.followerId} = ${profileId})::int`,
      friendsCount: sql<number>`count(*) filter (where ${follows.followerId} = ${profileId} and ${follows.isMutual})::int`,
    })
    .from(follows)
    .where(or(eq(follows.followingId, profileId), eq(follows.followerId, profileId)));

  return {
    followersCount: row?.followersCount ?? 0,
    followingCount: row?.followingCount ?? 0,
    friendsCount: row?.friendsCount ?? 0,
  };
}
