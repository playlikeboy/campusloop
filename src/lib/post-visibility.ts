import { and, eq, type SQL, sql } from "drizzle-orm";
import type { getDb } from "@/db";
import { communities, communityMembers, posts } from "@/db/schema";

/**
 * SQL guard that keeps posts of communities the viewer may not read out of a
 * query on `posts`. Posts outside any community always pass.
 *
 * - `mode: "listing"` (feeds, search, trends, sitemaps): only PUBLIC communities,
 *   plus any community the viewer created or is an ACTIVE member of. UNLISTED
 *   communities stay out of listings, as they do from the community directory.
 * - `mode: "direct"` (a post opened by id or link): PUBLIC and UNLISTED pass,
 *   PRIVATE needs the creator or an ACTIVE membership.
 *
 * Pass `viewerProfileId: null` for anonymous or public surfaces (RSS, sitemaps):
 * only non-member rules apply.
 */
export function communityPostVisibleSql(
  viewerProfileId: string | null | undefined,
  mode: "listing" | "direct" = "listing"
): SQL {
  const viewer = viewerProfileId ?? null;
  const openPrivacy = mode === "direct" ? sql`${communities.privacy} <> 'PRIVATE'` : sql`${communities.privacy} = 'PUBLIC'`;
  const viewerAccess = viewer
    ? sql` or ${communities.creatorId} = ${viewer} or exists (
        select 1 from ${communityMembers}
        where ${communityMembers.communityId} = ${communities.id}
          and ${communityMembers.userId} = ${viewer}
          and ${communityMembers.status} = 'ACTIVE'
      )`
    : sql``;
  return sql`(${posts.communityId} is null or exists (
    select 1 from ${communities}
    where ${communities.id} = ${posts.communityId}
      and (${openPrivacy}${viewerAccess})
  ))`;
}

/** In-memory twin of `communityPostVisibleSql` for a single row already loaded. */
export function canViewCommunityPost(input: {
  community: { privacy: string; creatorId?: string | null } | null | undefined;
  viewerProfileId: string | null | undefined;
  isActiveMember: boolean;
  mode?: "listing" | "direct";
}): boolean {
  const { community, viewerProfileId, isActiveMember } = input;
  if (!community) return true;
  const open = input.mode === "direct" ? community.privacy !== "PRIVATE" : community.privacy === "PUBLIC";
  if (open) return true;
  if (!viewerProfileId) return false;
  return community.creatorId === viewerProfileId || isActiveMember;
}

/**
 * Direct-access check for one post (detail API, post page, comments): PRIVATE
 * community posts need the creator or an ACTIVE membership. Loads the community
 * and membership only when the post sits in a non-public community.
 */
export async function viewerCanReadPost(
  db: ReturnType<typeof getDb>,
  post: { communityId: string | null },
  viewerProfileId: string | null | undefined
): Promise<boolean> {
  if (!post.communityId) return true;
  const community = await db.query.communities.findFirst({
    where: eq(communities.id, post.communityId),
    columns: { privacy: true, creatorId: true },
  });
  if (!community || community.privacy !== "PRIVATE") return true;
  if (!viewerProfileId) return false;
  if (community.creatorId === viewerProfileId) return true;
  const membership = await db.query.communityMembers.findFirst({
    where: and(eq(communityMembers.communityId, post.communityId), eq(communityMembers.userId, viewerProfileId)),
    columns: { status: true },
  });
  return canViewCommunityPost({ community, viewerProfileId, isActiveMember: membership?.status === "ACTIVE", mode: "direct" });
}
