import { and, eq } from "drizzle-orm";
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
import { createNotification } from "@/lib/notifications";
import { rejectViewerWrite } from "@/lib/viewer";

export async function POST(req: Request) {
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

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const body = (await req.json().catch(() => ({}))) as {
      targetId?: unknown;
      targetUserId?: unknown;
      direction?: unknown;
      action?: unknown;
    };

    const rawTarget = body.targetId || body.targetUserId;
    if (typeof rawTarget !== "string" || rawTarget.trim().length === 0) {
      return NextResponse.json({ error: "Missing targetId parameter" }, { status: 400 });
    }

    const targetId = rawTarget.trim();

    if (targetId === profile.id) {
      return NextResponse.json({ error: "You cannot swipe on yourself" }, { status: 400 });
    }

    // Verify target exists and is ACTIVE
    const targetProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, targetId),
    });

    if (!targetProfile) {
      return NextResponse.json({ error: "Target profile not found" }, { status: 404 });
    }

    if (targetProfile.status !== "ACTIVE") {
      return NextResponse.json({ error: "Target profile is not active" }, { status: 400 });
    }

    // Validate direction against exact allowlist ("LIKE", "PASS")
    let rawDir: string | undefined;
    if (typeof body.direction === "string") {
      rawDir = body.direction.trim().toUpperCase();
    } else if (typeof body.action === "string") {
      rawDir = body.action.trim().toUpperCase();
    }

    if (!rawDir || (rawDir !== "LIKE" && rawDir !== "PASS")) {
      return NextResponse.json(
        { error: "Invalid direction. Direction must be either 'LIKE' or 'PASS'" },
        { status: 400 }
      );
    }

    const direction: "LIKE" | "PASS" = rawDir;

    // Upsert so changing your mind (e.g. like-back after an old pass) works
    await db
      .insert(swipes)
      .values({
        swiperId: profile.id,
        targetId,
        direction,
      })
      .onConflictDoUpdate({
        target: [swipes.swiperId, swipes.targetId],
        set: { direction },
      });

    // Check if it's a mutual LIKE
    if (direction === "LIKE") {
      const mutual = await db.query.swipes.findFirst({
        where: and(
          eq(swipes.swiperId, targetId),
          eq(swipes.targetId, profile.id),
          eq(swipes.direction, "LIKE")
        ),
      });

      if (mutual) {
        // Ensure idempotent conversation creation: check if a DIRECT conversation already exists
        const myConvs = await db.query.conversationParticipants.findMany({
          where: eq(conversationParticipants.userId, profile.id),
        });
        const targetConvs = await db.query.conversationParticipants.findMany({
          where: eq(conversationParticipants.userId, targetId),
        });

        const myConvIds = new Set(myConvs.map((m) => m.conversationId));
        const commonConvParticipant = targetConvs.find((tc) => myConvIds.has(tc.conversationId));

        let conversationId: string | null = null;
        if (commonConvParticipant) {
          const existingConv = await db.query.conversations.findFirst({
            where: and(
              eq(conversations.id, commonConvParticipant.conversationId),
              eq(conversations.type, "DIRECT")
            ),
          });
          if (existingConv) {
            conversationId = existingConv.id;
          }
        }

        let isNewMatch = false;
        if (!conversationId) {
          const [newConv] = await db
            .insert(conversations)
            .values({
              type: "DIRECT",
            })
            .returning();
          conversationId = newConv.id;
          isNewMatch = true;

          await db.insert(conversationParticipants).values([
            { conversationId: newConv.id, userId: profile.id },
            { conversationId: newConv.id, userId: targetId },
          ]);

          // Send match greeting
          await db.insert(messages).values({
            conversationId: newConv.id,
            senderId: profile.id,
            body: "🎉 Match made! You both swiped right on each other. Say hello!",
          });
        }

        // Only send push notifications for newly created match conversations
        if (isNewMatch) {
          const matchBlurb = "You matched with each other on Campus Match! 🎉 Say hello in chat.";

          await Promise.all([
            createNotification({
              userId: profile.id,
              actorId: targetId,
              type: "MATCH",
              referenceId: conversationId,
              previewText: matchBlurb,
              silent: true,
            }),
            createNotification({
              userId: targetId,
              actorId: profile.id,
              type: "MATCH",
              referenceId: conversationId,
              previewText: matchBlurb,
            }),
          ]);
        }

        return NextResponse.json({
          matched: true,
          conversationId,
          matchedUser: {
            displayName: targetProfile.displayName,
            avatarUrl: targetProfile.avatarUrl,
          },
        });
      }
    }

    return NextResponse.json({ matched: false });
  } catch (error) {
    console.error("Error logging dating swipe:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Undo / reset swipes.
 * With `?targetId=`: removes just that one swipe (the Rewind button).
 * Without: clears every swipe so the deck starts fresh.
 */
export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("targetId");

    if (targetId) {
      await db.delete(swipes).where(and(eq(swipes.swiperId, profile.id), eq(swipes.targetId, targetId)));
      return NextResponse.json({ success: true, message: "Swipe undone" });
    }

    await db.delete(swipes).where(eq(swipes.swiperId, profile.id));

    return NextResponse.json({ success: true, message: "Swipes reset successfully" });
  } catch (error) {
    console.error("Error resetting swipes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
