import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { pollOptions, pollVotes, posts, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { recordStreakActivity } from "@/lib/streaks/streak-service";
import { rejectViewerWrite } from "@/lib/viewer";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const payload = (await req.json().catch(() => ({}))) as { optionId?: unknown };
    const { optionId } = payload;

    if (typeof optionId !== "string" || optionId.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid optionId" }, { status: 400 });
    }

    const trimmedOptionId = optionId.trim();

    // Verify post exists and is an active, published poll
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status !== "PUBLISHED") {
      return NextResponse.json({ error: "This poll is not currently active" }, { status: 400 });
    }

    if (post.type !== "POLL") {
      return NextResponse.json({ error: "Post is not a poll" }, { status: 400 });
    }

    // Verify requested optionId belongs to requested post
    const pollOption = await db.query.pollOptions.findFirst({
      where: eq(pollOptions.id, trimmedOptionId),
    });

    if (!pollOption) {
      return NextResponse.json({ error: "Poll option not found" }, { status: 404 });
    }

    if (pollOption.postId !== postId) {
      return NextResponse.json(
        { error: "Poll option does not belong to this poll" },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const existingVote = await db.query.pollVotes.findFirst({
      where: and(eq(pollVotes.postId, postId), eq(pollVotes.userId, profile.id)),
    });

    if (existingVote) {
      return NextResponse.json({ error: "You have already voted on this poll" }, { status: 400 });
    }

    // Insert vote with onConflictDoNothing to handle concurrent racing requests
    const insertedVotes = await db
      .insert(pollVotes)
      .values({
        postId,
        optionId: trimmedOptionId,
        userId: profile.id,
      })
      .onConflictDoNothing({
        target: [pollVotes.userId, pollVotes.postId],
      })
      .returning();

    if (insertedVotes.length === 0) {
      return NextResponse.json({ error: "You have already voted on this poll" }, { status: 400 });
    }

    // Keep student streak alive for participating in campus polls
    void recordStreakActivity({
      userId: profile.id,
      eventType: "POLL_VOTE",
      sourceEntityId: postId,
    }).catch((err) => console.warn("[Streak Poll Hook Error]:", err));

    return NextResponse.json(insertedVotes[0], { status: 201 });
  } catch (error) {
    console.error("Error casting poll vote:", error);
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}
