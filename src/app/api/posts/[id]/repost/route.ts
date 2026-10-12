import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { posts, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { runInBackground } from "@/lib/background";
import { createNotification } from "@/lib/notifications";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { commentary } = (await req.json()) as { commentary?: string };

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    // Fetch original post
    const originalPost = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: { author: true },
    });

    if (!originalPost) {
      return NextResponse.json({ error: "Original post not found" }, { status: 404 });
    }

    // Insert new post into DB with repostOfId DB flag
    const [repostedPost] = await db
      .insert(posts)
      .values({
        authorId: profile.id,
        institutionId: profile.institutionId || originalPost.institutionId,
        body: commentary && commentary.trim().length > 0 ? commentary.trim() : originalPost.body,
        type: originalPost.type,
        repostOfId: originalPost.id,
        repostComment: commentary && commentary.trim().length > 0 ? commentary.trim() : null,
        isAnonymous: false,
        status: "PUBLISHED",
      })
      .returning();

    // Trigger REPOST notification to original author
    if (originalPost.authorId && originalPost.authorId !== profile.id) {
      runInBackground(
        createNotification({
          userId: originalPost.authorId,
          actorId: profile.id,
          type: "REPOST",
          referenceId: originalPost.id,
          previewText: commentary || originalPost.body,
        }),
        "repost notification"
      );
    }

    return NextResponse.json(repostedPost, { status: 201 });
  } catch (error) {
    console.error("Error creating repost:", error);
    return NextResponse.json({ error: "Failed to create repost" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const repost = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      columns: {
        id: true,
        authorId: true,
        repostOfId: true,
      },
    });

    if (!repost) {
      return NextResponse.json({ error: "Repost not found" }, { status: 404 });
    }

    if (!repost.repostOfId) {
      return NextResponse.json({ error: "This post is not a repost" }, { status: 400 });
    }

    if (repost.authorId !== profile.id) {
      return NextResponse.json({ error: "You can only undo your own repost" }, { status: 403 });
    }

    const [removed] = await db
      .delete(posts)
      .where(and(eq(posts.id, repost.id), eq(posts.authorId, profile.id)))
      .returning({ id: posts.id });

    if (!removed) {
      return NextResponse.json({ error: "Repost could not be removed" }, { status: 409 });
    }

    return NextResponse.json({ success: true, repostId: removed.id });
  } catch (error) {
    console.error("Error undoing repost:", error);
    return NextResponse.json({ error: "Failed to undo repost" }, { status: 500 });
  }
}
