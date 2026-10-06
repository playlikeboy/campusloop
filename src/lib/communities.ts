import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { communities, communityMembers, type Community } from "@/db/schema";

export class CommunityPostAuthError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
    this.name = "CommunityPostAuthError";
  }
}

export interface AssertCanCreateCommunityPostOptions {
  isAnonymous?: boolean;
  type?: string;
  db?: ReturnType<typeof getDb>;
}

/**
 * Asserts whether a profile is authorized to publish a post inside a community.
 *
 * Rules:
 * 1. Community must exist.
 * 2. If allowAnonymousPosts is false, reject anonymous posts and confessions.
 * 3. If community privacy is PRIVATE:
 *    - Creator is permitted unless explicitly banned.
 *    - Regular members must have an ACTIVE membership record.
 *    - PENDING and BANNED members are rejected.
 */
export async function assertCanCreateCommunityPost(
  profileId: string,
  communityId: string,
  options?: AssertCanCreateCommunityPostOptions
): Promise<Community> {
  const db = options?.db ?? getDb();

  const community = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
  });

  if (!community) {
    throw new CommunityPostAuthError("Community not found", 404);
  }

  if (!community.allowAnonymousPosts && (options?.isAnonymous || options?.type === "CONFESSION")) {
    throw new CommunityPostAuthError(
      "Anonymous posts and confessions are disabled in this community.",
      400
    );
  }

  if (community.privacy === "PRIVATE") {
    const membership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, profileId)
      ),
    });

    if (community.creatorId === profileId) {
      if (membership?.status === "BANNED") {
        throw new CommunityPostAuthError("You are banned from this community", 403);
      }
      return community;
    }

    if (!membership) {
      throw new CommunityPostAuthError(
        "Only active members can post in this private community",
        403
      );
    }

    if (membership.status === "BANNED") {
      throw new CommunityPostAuthError("You are banned from this community", 403);
    }

    if (membership.status === "PENDING") {
      throw new CommunityPostAuthError(
        "Your membership to this private community is pending approval",
        403
      );
    }

    if (membership.status !== "ACTIVE") {
      throw new CommunityPostAuthError(
        "Only active members can post in this private community",
        403
      );
    }
  }

  return community;
}
