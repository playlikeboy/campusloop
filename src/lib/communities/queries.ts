import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { communities, communityMembers, userProfiles } from "@/db/schema";

export interface CommunityDirectoryItem {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  privacy: string;
  category: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  points: number;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  postCount: number;
  latestActivityAt: Date | null;
  isMember: boolean;
  creator: {
    id: string;
    username: string;
    displayName: string;
  };
}

export interface CommunityDirectoryOptions {
  profileId?: string | null;
  limit?: number;
  search?: string;
  category?: string;
  joinedOnly?: boolean;
  sort?: "recent" | "popular";
}

function memberExistsSql(profileId: string | null | undefined) {
  if (!profileId) return sql<boolean>`false`;
  return sql<boolean>`exists (
    select 1
    from community_members cm
    where cm.community_id = ${communities.id
      and cm.user_id = ${profileId
      and cm.status = 'ACTIVE'
  )`;
}

export async function getCommunityDirectory(
  options: CommunityDirectoryOptions = {}
): Promise<CommunityDirectoryItem[]> {
  const db = getDb();
  const limit = Math.min(Math.max(options.limit ?? 36, 1), 60);
  const profileId = options.profileId ?? null;
  const isMemberExpr = memberExistsSql(profileId);

  const conditions = [
    or(ne(communities.privacy, "UNLISTED"), isMemberExpr),
  ];

  const query = options.search?.trim();
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(
      or(
        ilike(communities.name, pattern),
        ilike(communities.description, pattern)
      )
    );
  }

  if (options.category && options.category !== "All") {
    conditions.push(eq(communities.category, options.category));
  }

  if (options.joinedOnly) {
    if (!profileId) return [];
    conditions.push(isMemberExpr);
  }

  const rows = await db
    .select({
      id: communities.id,
      name: communities.name,
      slug: communities.slug,
      description: communities.description,
      privacy: communities.privacy,
      category: communities.category,
      avatarUrl: communities.avatarUrl,
      bannerUrl: communities.bannerUrl,
      points: communities.points,
      creatorId: communities.creatorId,
      createdAt: communities.createdAt,
      updatedAt: communities.updatedAt,
      memberCount: sql<number>`(
        select count(*)::int
        from community_members cm_count
        where cm_count.community_id = ${communities.id
          and cm_count.status = 'ACTIVE'
      )`,
      postCount: sql<number>`(
        select count(*)::int
        from posts p_count
        where p_count.community_id = ${communities.id
          and p_count.status = 'PUBLISHED'
      )`,
      latestActivityAt: sql<Date | null>`(
        select max(p_activity.created_at)
        from posts p_activity
        where p_activity.community_id = ${communities.id
          and p_activity.status = 'PUBLISHED'
      )`,
      isMember: isMemberExpr,
      creator: {
        id: userProfiles.id,
        username: userProfiles.username,
        displayName: userProfiles.displayName,
      },
    })
    .from(communities)
    .leftJoin(userProfiles, eq(communities.creatorId, userProfiles.id))
    .where(and(...conditions))
    .orderBy(
      options.sort === "popular"
        ? [desc(communities.points), desc(communities.createdAt)]
        : [desc(communities.createdAt)]
    )
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    points: Number(row.points ?? 0),
    memberCount: Number(row.memberCount ?? 0),
    postCount: Number(row.postCount ?? 0),
    isMember: Boolean(row.isMember),
    latestActivityAt: row.latestActivityAt ? new Date(row.latestActivityAt) : null,
    creator: row.creator.id
      ? row.creator
      : { id: row.creatorId, username: "student", displayName: "Student" },
  }));
}

export interface CommunitySummary {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  privacy: string;
  category: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  points: number;
  rules: string | null;
  allowAnonymousPosts: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  postCount: number;
  creator: {
    id: string;
    username: string;
    displayName: string;
  };
}

export async function getCommunitySummary(idOrSlug: string): Promise<CommunitySummary | null> {
  if (!idOrSlug) return null;

  const db = getDb();
  const rows = await db
    .select({
      id: communities.id,
      name: communities.name,
      slug: communities.slug,
      description: communities.description,
      privacy: communities.privacy,
      category: communities.category,
      avatarUrl: communities.avatarUrl,
      bannerUrl: communities.bannerUrl,
      points: communities.points,
      rules: communities.rules,
      allowAnonymousPosts: communities.allowAnonymousPosts,
      creatorId: communities.creatorId,
      createdAt: communities.createdAt,
      updatedAt: communities.updatedAt,
      memberCount: sql<number>`(
        select count(*)::int
        from community_members cm_count
        where cm_count.community_id = ${communities.id
          and cm_count.status = 'ACTIVE'
      )`,
      postCount: sql<number>`(
        select count(*)::int
        from posts p_count
        where p_count.community_id = ${communities.id
          and p_count.status = 'PUBLISHED'
      )`,
      creator: {
        id: userProfiles.id,
        username: userProfiles.username,
        displayName: userProfiles.displayName,
      },
    })
    .from(communities)
    .leftJoin(userProfiles, eq(communities.creatorId, userProfiles.id))
    .where(or(eq(communities.id, idOrSlug), eq(communities.slug, idOrSlug)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...row,
    points: Number(row.points ?? 0),
    memberCount: Number(row.memberCount ?? 0),
    postCount: Number(row.postCount ?? 0),
    creator: row.creator.id
      ? row.creator
      : { id: row.creatorId, username: "student", displayName: "Student" },
  };
}

export async function getCommunityMembership(communityId: string, profileId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: communityMembers.id,
      role: communityMembers.role,
      status: communityMembers.status,
      createdAt: communityMembers.createdAt,
    })
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, profileId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getCommunityMemberPreview(communityId: string, limit = 30) {
  const db = getDb();
  return db.query.communityMembers.findMany({
    where: and(
      eq(communityMembers.communityId, communityId),
      eq(communityMembers.status, "ACTIVE")
    ),
    orderBy: [desc(communityMembers.createdAt)],
    limit: Math.min(Math.max(limit, 1), 60),
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          headline: true,
          points: true,
        },
      },
    },
  });
}
