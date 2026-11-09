import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { communities, conversationParticipants, conversations } from "@/db/schema";
import { requireProfile } from "@/lib/require-profile";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const { id } = await params;
    const db = getDb();


    // Find the community by id or slug
    const cleanId = id.trim();
    const comm = await db.query.communities.findFirst({
      where: or(eq(communities.id, cleanId), eq(communities.slug, cleanId.toLowerCase())),
    });

    if (!comm) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Find existing community conversation
    let conv = await db.query.conversations.findFirst({
      where: and(eq(conversations.communityId, comm.id), eq(conversations.type, "COMMUNITY")),
    });

    if (!conv) {
      // Create new community group conversation
      const [newConv] = await db
        .insert(conversations)
        .values({
          communityId: comm.id,
          type: "COMMUNITY",
          title: `c/${comm.name}`,
          avatarUrl: comm.avatarUrl || null,
        })
        .returning();
      conv = newConv;
    }

    // Ensure the current student is in conversation_participants
    const existingParticipant = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conv.id),
        eq(conversationParticipants.userId, profile.id)
      ),
    });

    if (!existingParticipant) {
      await db.insert(conversationParticipants).values({
        conversationId: conv.id,
        userId: profile.id,
      });
    }

    return NextResponse.json({
      conversationId: conv.id,
      title: conv.title,
      communityId: comm.id,
      type: "COMMUNITY",
    });
  } catch (error) {
    console.error("Error opening community group chat:", error);
    return NextResponse.json({ error: "Failed to open community group chat" }, { status: 500 });
  }
}
