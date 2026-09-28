import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { conversationParticipants } from "@/db/schema";

/** Return the participant row only when the profile belongs to the conversation. */
export async function requireConversationParticipant(conversationId: string, profileId: string) {
  if (!conversationId || !profileId) return null;

  const db = getDb();
  return db.query.conversationParticipants.findFirst({
    where: and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, profileId)
    ),
  });
}
