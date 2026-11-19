import { and, eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { blocks, conversationParticipants, conversations } from "@/db/schema";

/** True when either student has blocked the other. */
export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  if (!a || !b || a === b) return false;
  const row = await getDb().query.blocks.findFirst({
    where: or(
      and(eq(blocks.blockerId, a), eq(blocks.blockedUserId, b)),
      and(eq(blocks.blockerId, b), eq(blocks.blockedUserId, a))
    ),
    columns: { id: true },
  });
  return Boolean(row);
}

/**
 * For a DIRECT conversation: true when the sender and the other participant
 * have a block between them. Group chats are not affected.
 */
export async function isDirectChatBlocked(conversationId: string, senderId: string): Promise<boolean> {
  const db = getDb();
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
    columns: { type: true },
  });
  if (!conv || conv.type !== "DIRECT") return false;
  const others = await db.query.conversationParticipants.findMany({
    where: eq(conversationParticipants.conversationId, conversationId),
    columns: { userId: true },
  });
  for (const p of others) {
    if (p.userId !== senderId && (await isBlockedEitherWay(senderId, p.userId))) return true;
  }
  return false;
}
