import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  conversationParticipants,
  conversations,
  messages,
  swipes,
  userProfiles,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // 1. Find all users I liked
    const myLikes = await db.query.swipes.findMany({
      where: and(eq(swipes.swiperId, profile.id), eq(swipes.direction, "LIKE")),
      columns: {
        targetId: true,
        createdAt: true,
      },
    });

    if (myLikes.length === 0) {
      return NextResponse.json({ matches: [], totalCount: 0 });
    }

    const myLikedIds = myLikes.map((l) => l.targetId);

    // 2. Find all mutual likes (users who also liked me)
    const mutualLikes = await db.query.swipes.findMany({
      where: and(
        eq(swipes.targetId, profile.id),
        eq(swipes.direction, "LIKE"),
        inArray(swipes.swiperId, myLikedIds)
      ),
      orderBy: [desc(swipes.createdAt)],
    });

    if (mutualLikes.length === 0) {
      return NextResponse.json({ matches: [], totalCount: 0 });
    }

    const matchedUserIds = mutualLikes.map((m) => m.swiperId);

    // 3. Fetch matched user profiles
    const matchedProfiles = await db.query.userProfiles.findMany({
      where: inArray(userProfiles.id, matchedUserIds),
      with: {
        institution: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      columns: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
        branch: true,
        year: true,
        interests: true,
        gender: true,
      },
    });

    const profilesMap = new Map(matchedProfiles.map((p) => [p.id, p]));

    // 4. Find conversation IDs for direct messages
    const myParticipations = await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, profile.id),
    });
    const myConvIds = myParticipations.map((p) => p.conversationId);

    let matchConversations: Record<string, { conversationId: string; lastMessage?: string | null; lastMessageAt?: string | null }> = {};

    if (myConvIds.length > 0) {
      const otherParticipations = await db.query.conversationParticipants.findMany({
        where: and(
          inArray(conversationParticipants.conversationId, myConvIds),
          inArray(conversationParticipants.userId, matchedUserIds)
        ),
      });

      for (const p of otherParticipations) {
        matchConversations[p.userId] = {
          conversationId: p.conversationId,
        };
      }
    }

    const matches = mutualLikes
      .map((m) => {
        const userMatch = profilesMap.get(m.swiperId);
        if (!userMatch) return null;
        const conv = matchConversations[m.swiperId];
        return {
          id: m.id,
          matchedAt: m.createdAt,
          user: userMatch,
          conversationId: conv?.conversationId ?? null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      matches,
      totalCount: matches.length,
    });
  } catch (error) {
    console.error("Error fetching dating matches:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
