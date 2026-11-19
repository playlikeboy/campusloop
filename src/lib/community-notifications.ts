import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { communityMembers } from "@/db/schema";
import { createNotification, createNotificationsForMany } from "@/lib/notifications";

interface CommunityRef {
  id: string;
  slug: string | null;
  name: string;
  creatorId: string;
}

/** Notifications deep-link with the slug when there is one, like the rest of the app. */
const communityRef = (comm: CommunityRef) => comm.slug || comm.id;

/**
 * A student asked to join a private community: tell the creator and every
 * active admin, who are the people able to approve it. Never throws.
 */
export async function notifyCommunityJoinRequest(
  comm: CommunityRef,
  requester: { id: string; displayName: string }
): Promise<void> {
  try {
    const admins = await getDb()
      .select({ userId: communityMembers.userId })
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, comm.id),
          eq(communityMembers.role, "ADMIN"),
          eq(communityMembers.status, "ACTIVE")
        )
      );
    await createNotificationsForMany({
      recipientIds: [comm.creatorId, ...admins.map((a) => a.userId)],
      actorId: requester.id,
      type: "COMMUNITY_JOIN_REQUEST",
      referenceId: communityRef(comm),
      previewText: `${requester.displayName} asked to join ${comm.name}`,
      maxRecipients: 20,
    });
  } catch (error) {
    console.error("notifyCommunityJoinRequest failed:", error);
  }
}

/** A pending request was approved: tell the student they are in. Never throws. */
export async function notifyCommunityJoinApproved(
  comm: CommunityRef,
  memberId: string,
  approverId: string
): Promise<void> {
  try {
    await createNotification({
      userId: memberId,
      actorId: approverId,
      type: "COMMUNITY_JOIN_APPROVED",
      referenceId: communityRef(comm),
      previewText: `You're now a member of ${comm.name}`,
    });
  } catch (error) {
    console.error("notifyCommunityJoinApproved failed:", error);
  }
}
