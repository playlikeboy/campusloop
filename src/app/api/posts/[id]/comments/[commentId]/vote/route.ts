import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { anonIdentityVault, comments, commentVotes, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { openSealedIdentity } from "@/lib/anonymity";
import { cleanNotificationSnippet, createNotification } from "@/lib/notifications";
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

    const targetComment = await db.query.comments.findFirst({
      where: and(eq(comments.id, commentId), eq(comments.postId, postId)),
    });

    if (!targetComment || targetComment.status === "DELETED") {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check existing vote
    const existingVote = await db.query.commentVotes.findFirst({
      where: and(
        eq(commentVotes.commentId, commentId),
        eq(commentVotes.userId, profile.id)
      ),
    });

    let hasLiked = false;
    let newLikesCount = targetComment.likesCount || 0;

    if (existingVote) {
      // Unlike with returning to ensure idempotency across concurrent racing requests
      const deleted = await db
        .delete(commentVotes)
        .where(
          and(
            eq(commentVotes.commentId, commentId),
            eq(commentVotes.userId, profile.id)
          )
        )
        .returning({ id: commentVotes.id });

      if (deleted.length > 0) {
        const [updated] = await db
          .update(comments)
          .set({
            likesCount: sql`GREATEST(0, ${comments.likesCount} - 1)`,
          })
          .where(eq(comments.id, commentId))
          .returning({ likesCount: comments.likesCount });

        newLikesCount = updated?.likesCount ?? Math.max(0, newLikesCount - 1);
      }
      hasLiked = false;
    } else {
      // Like with onConflictDoNothing to ensure idempotency and concurrency safety
      const inserted = await db
        .insert(commentVotes)
        .values({
          commentId,
          userId: profile.id,
        })
        .onConflictDoNothing({
          target: [commentVotes.userId, commentVotes.commentId],
        })
        .returning({ id: commentVotes.id });

      if (inserted.length > 0) {
        const [updated] = await db
          .update(comments)
          .set({
            likesCount: sql`${comments.likesCount} + 1`,
          })
          .where(eq(comments.id, commentId))
          .returning({ likesCount: comments.likesCount });

        newLikesCount = updated?.likesCount ?? newLikesCount + 1;
        hasLiked = true;

        // Award +1 Loop Point to comment author (if not self and not anonymous) ONLY ONCE on new like
        let authorProfileId = targetComment.authorId;
        if (!authorProfileId && targetComment.isAnonymous && targetComment.pseudonym) {
          try {
            const vault = await db.query.anonIdentityVault.findFirst({
              where: eq(anonIdentityVault.handle, targetComment.pseudonym),
            });
            if (vault?.sealedIdentity) {
              authorProfileId = openSealedIdentity(vault.sealedIdentity);
            }
          } catch {}
        }

        if (authorProfileId && authorProfileId !== profile.id) {
          try {
            await db
              .update(userProfiles)
              .set({ points: sql`${userProfiles.points} + 1` })
              .where(eq(userProfiles.id, authorProfileId));
          } catch (lpErr) {
            console.warn("Could not award comment like LP:", lpErr);
          }

          try {
            await createNotification({
              userId: authorProfileId,
              type: "LIKE",
              actorId: profile.id,
              referenceId: postId,
              previewText: cleanNotificationSnippet(targetComment.body, 80) || "Liked your comment",
            });
          } catch (notifErr) {
            console.warn("Could not create comment like notification:", notifErr);
          }
        }
      } else {
        // Already liked in a racing request
        hasLiked = true;
      }
    }

    return NextResponse.json({
      success: true,
      hasLiked,
      likesCount: newLikesCount,
    });
  } catch (error) {
    console.error("Error toggling comment like:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to vote on comment" },
      { status: 500 }
    );
  }
}
