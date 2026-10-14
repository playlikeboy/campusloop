import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { aiConversations, aiFeedback, aiMessages, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      messageId?: unknown;
      rating?: unknown;
      reason?: unknown;
    } | null;
    const messageId = typeof body?.messageId === "string" ? body.messageId.trim() : "";
    const rating = body?.rating;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (!messageId || messageId.length > 160 || (rating !== "helpful" && rating !== "unhelpful")) {
      return NextResponse.json({ error: "A valid messageId and rating are required" }, { status: 400 });
    }
    if (reason.length > 500) {
      return NextResponse.json({ error: "Feedback reason must be 500 characters or fewer" }, { status: 400 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // The feedback target must be an assistant response in the current student's own conversation.
    const message = await db.query.aiMessages.findFirst({
      where: eq(aiMessages.id, messageId),
    });
    if (!message || message.role !== "assistant") {
      return NextResponse.json({ error: "Assistant message not found" }, { status: 404 });
    }

    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, message.conversationId),
        eq(aiConversations.userId, profile.id)
      ),
      columns: { id: true },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Assistant message not found" }, { status: 404 });
    }

    const feedbackId = `aifb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(aiFeedback).values({
      id: feedbackId,
      userId: profile.id,
      messageId,
      rating,
      reason: reason || null,
    });

    return NextResponse.json({ success: true, id: feedbackId });
  } catch (error) {
    console.error("AI Feedback error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
