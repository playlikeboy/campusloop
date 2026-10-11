import "server-only";

import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { academicPlaylists, academicResources, externalPosts, follows, institutions, posts, userProfiles } from "@/db/schema";

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

export async function findExternalPostsForPosts(postIds: string[]) {
  if (postIds.length === 0) return [];
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


export function findProfileByUsername(username: string) {
  return getDb().query.userProfiles.findFirst({
    where: or(
      eq(userProfiles.username, username),
      sql`lower(${userProfiles.username}) = lower(${username})`
    ),
    with: { institution: true },
  });
}

export function findProfileByUserId(userId: string) {
  return getDb().query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });
}

export function findProfileInstitutionById(institutionId: string) {
  return getDb().query.institutions.findFirst({
    where: eq(institutions.id, institutionId),
  });
}

export function findPublicProfilePosts(profileId: string, userId: string) {
  return getDb().query.posts.findMany({
    where: and(
      or(eq(posts.authorId, profileId), eq(posts.authorId, userId)),
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

export function findProfileAcademicResources(profileId: string) {
  return getDb().query.academicResources.findMany({
    where: eq(academicResources.uploaderId, profileId),
    orderBy: [desc(academicResources.createdAt)],
    limit: 6,
    with: { institution: true },
  });
}

export function findProfileAcademicPlaylists(profileId: string) {
  return getDb().query.academicPlaylists.findMany({
    where: eq(academicPlaylists.creatorId, profileId),
    orderBy: [desc(academicPlaylists.createdAt)],
    limit: 4,
  });
}
