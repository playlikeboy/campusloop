import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { communities, communityMembers, conversationParticipants, conversations } from "@/db/schema";
import { requireProfile } from "@/lib/require-profile";
import { requireCapability } from "@/lib/trust-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;
    const capabilityBlocked = await requireCapability(profile, "chat_dm");
    if (capabilityBlocked) return capabilityBlocked;

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

    // Banned members never get in; non-public communities need an ACTIVE membership (or the creator).
    const membership = await db.query.communityMembers.findFirst({
      where: and(eq(communityMembers.communityId, comm.id), eq(communityMembers.userId, profile.id)),
      columns: { status: true },
    });
    if (membership?.status === "BANNED") {
      return NextResponse.json({ error: "You can't join this community chat" }, { status: 403 });
    }
    if (comm.privacy !== "PUBLIC" && comm.creatorId !== profile.id && membership?.status !== "ACTIVE") {
      return NextResponse.json({ error: "Join this community to open its chat" }, { status: 403 });
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
