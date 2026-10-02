import { and, eq, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { articleComments, articleCommentVotes, articles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { awardPoints } from "@/lib/gamification-server";
import { createNotification } from "@/lib/notifications";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ slug: string; commentId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const { slug, commentId } = await params;
    const cleanSlug = decodeURIComponent(slug);

    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const article = await db.query.articles.findFirst({
      where: or(
        eq(articles.slug, cleanSlug),
        eq(articles.id, cleanSlug),
        eq(articles.slug, slug),
        eq(articles.id, slug)
      ),
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const comment = await db.query.articleComments.findFirst({
      where: and(
        eq(articleComments.id, commentId),
        eq(articleComments.articleId, article.id)
      ),
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const existingVote = await db.query.articleCommentVotes.findFirst({
      where: and(eq(articleCommentVotes.commentId, commentId), eq(articleCommentVotes.profileId, profile.id)),
    });

    let newVote = 0;
    let upvotesCount = comment.upvotesCount || 0;

    if (!existingVote) {
      await db.insert(articleCommentVotes).values({
        id: crypto.randomUUID(),
        commentId,
        profileId: profile.id,
        value: 1,
      });

      const [updated] = await db
        .update(articleComments)
        .set({ upvotesCount: sql`${articleComments.upvotesCount} + 1` })
        .where(eq(articleComments.id, commentId))
        .returning({ upvotesCount: articleComments.upvotesCount });

      upvotesCount = updated?.upvotesCount ?? upvotesCount + 1;
      newVote = 1;

      // Award +2 LP to comment author (if not self-voting)
      if (comment.authorId !== profile.id) {
        try {
          await awardPoints(comment.authorId, 2, "UPVOTE_RECEIVED", {
            referenceId: comment.id,
            actorId: profile.id,
          });

          await createNotification({
            userId: comment.authorId,
            actorId: profile.id,
            type: "LIKE",
            referenceId: article.id,
            previewText: comment.body.slice(0, 80) || "Upvoted your insight",
          });
        } catch (e) {
          console.warn("Failed to award comment vote reward/notification:", e);
        }
      }
    } else {
      // Toggle off
      await db
        .delete(articleCommentVotes)
        .where(
          and(eq(articleCommentVotes.commentId, commentId), eq(articleCommentVotes.profileId, profile.id))
        );

      const [updated] = await db
        .update(articleComments)
        .set({ upvotesCount: sql`GREATEST(0, ${articleComments.upvotesCount} - 1)` })
        .where(eq(articleComments.id, commentId))
        .returning({ upvotesCount: articleComments.upvotesCount });

      upvotesCount = updated?.upvotesCount ?? Math.max(0, upvotesCount - 1);
      newVote = 0;
    }

    return NextResponse.json({
      success: true,
      userVote: newVote,
      upvotesCount,
    });
  } catch (error) {
    console.error("POST article comment vote error:", error);
    return NextResponse.json({ error: "Failed to vote on comment" }, { status: 500 });
  }
}
