import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { anonIdentityVault, comments, posts, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { openSealedIdentity } from "@/lib/anonymity";
import { rejectViewerWrite } from "@/lib/viewer";

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId, commentId } = await params;
    const db = getDb();

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify if profile is the post author or admin
    let isAuthor = post.authorId === profile.id;
    if (!isAuthor && post.isAnonymous && post.pseudonym) {
      try {
        const vault = await db.query.anonIdentityVault.findFirst({
          where: eq(anonIdentityVault.handle, post.pseudonym),
        });
        if (vault?.sealedIdentity) {
          isAuthor = openSealedIdentity(vault.sealedIdentity) === profile.id;
        }
      } catch {}
    }

    const isAdmin = profile.role === "ADMIN" || profile.role === "MODERATOR";
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Only the post author or admins can pin comments" },
        { status: 403 }
      );
    }

    const targetComment = await db.query.comments.findFirst({
      where: and(eq(comments.id, commentId), eq(comments.postId, postId)),
    });

    if (!targetComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const nextPinnedState = !targetComment.isPinned;

    if (nextPinnedState) {
      // Unpin any existing pinned comment for this post first
      await db
        .update(comments)
        .set({ isPinned: false })
        .where(and(eq(comments.postId, postId), eq(comments.isPinned, true)));
    }

    // Set new pinned state
    const [updated] = await db
      .update(comments)
      .set({ isPinned: nextPinnedState })
      .where(eq(comments.id, commentId))
      .returning({ isPinned: comments.isPinned });

    return NextResponse.json({
      success: true,
      isPinned: updated?.isPinned ?? nextPinnedState,
    });
  } catch (error) {
    console.error("Error toggling comment pin:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to toggle pin state" },
      { status: 500 }
    );
  }
}
