import { and, asc, eq, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { articleComments, articleCommentVotes, articles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { runInBackground } from "@/lib/background";
import { awardPoints } from "@/lib/gamification-server";
import { createNotification } from "@/lib/notifications";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug);
    const db = getDb();
    const user = await hexclaveServerApp.getUser();

    let currentProfile = null;
    if (user) {
      currentProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });
    }

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

    // Fetch comments for this article, ordered chronologically
    const allComments = await db.query.articleComments.findMany({
      where: eq(articleComments.articleId, article.id),
      orderBy: [asc(articleComments.createdAt)],
      limit: 150,
      with: {
        author: {
          with: { institution: true },
        },
      },
    });

    // Fetch current user's votes on these comments
    const userCommentVotes: Record<string, number> = {};
    if (currentProfile && allComments.length > 0) {
      const votes = await db.query.articleCommentVotes.findMany({
        where: eq(articleCommentVotes.profileId, currentProfile.id),
      });
      votes.forEach((v) => {
        userCommentVotes[v.commentId] = v.value;
      });
    }

    // Group comments into root comments and nested replies
    const rootComments: any[] = [];
    const replyMap: Record<string, any[]> = {};

    allComments.forEach((c) => {
      const commentWithVote = {
        ...c,
        userVote: userCommentVotes[c.id] || 0,
        replies: [],
      };

      if (!c.parentId) {
        rootComments.push(commentWithVote);
      } else {
        if (!replyMap[c.parentId]) replyMap[c.parentId] = [];
        replyMap[c.parentId].push(commentWithVote);
      }
    });

    // Attach replies to roots
    rootComments.forEach((root) => {
      root.replies = replyMap[root.id] || [];
    });

    return NextResponse.json({
      comments: rootComments,
      totalCount: allComments.length,
    });
  } catch (error) {
    console.error("GET article comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const { slug } = await params;
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

    const blocked = await rejectViewerWrite(profile);
    if (blocked) return blocked;

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

    const body = (await req.json()) as { body?: string; parentId?: string };
    const commentBody = String(body?.body || "").trim();
    const parentId = body?.parentId ? String(body.parentId) : null;

    if (!commentBody || commentBody.length < 2) {
      return NextResponse.json({ error: "Comment text is too short." }, { status: 400 });
    }

    // Validate parent comment integrity (must belong to the exact same article)
    let parentComment = null;
    if (parentId) {
      parentComment = await db.query.articleComments.findFirst({
        where: and(eq(articleComments.id, parentId), eq(articleComments.articleId, article.id)),
      });
      if (!parentComment) {
        return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
      }
    }

    const commentId = crypto.randomUUID();
    await db.insert(articleComments).values({
      id: commentId,
      articleId: article.id,
      authorId: profile.id,
      parentId,
      body: commentBody,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fullComment = await db.query.articleComments.findFirst({
      where: eq(articleComments.id, commentId),
      with: {
        author: {
          with: { institution: true },
        },
      },
    });

    // Notify the article author if not commenting on one's own article
    if (article.authorId !== profile.id) {
      runInBackground(
        createNotification({
          userId: article.authorId,
          actorId: profile.id,
          type: "ARTICLE_COMMENT",
          referenceId: article.slug,
          previewText: `${profile.displayName || profile.username} commented on "${article.title.slice(0, 40)}"`,
        }),
        "article comment notification"
      );
    }

    // If this is a reply to another comment, notify that parent comment author
    if (
      parentComment &&
      parentComment.authorId !== profile.id &&
      parentComment.authorId !== article.authorId
    ) {
      runInBackground(
        createNotification({
          userId: parentComment.authorId,
          actorId: profile.id,
          type: "ARTICLE_COMMENT",
          referenceId: article.slug,
          previewText: `${profile.displayName || profile.username} replied to your comment on "${article.title.slice(0, 40)}"`,
        }),
        "article reply notification"
      );
    }

    // Award LP to student for contributing an insightful comment (+5 LP)
    runInBackground(
      awardPoints(profile.id, 5, "ARTICLE_COMMENT", {
        referenceId: commentId,
        actorId: profile.id,
        bypassCaps: false,
      }),
      "loop points award"
    );

    return NextResponse.json({
      comment: {
        ...fullComment,
        userVote: 0,
        replies: [],
      },
    });
  } catch (error) {
    console.error("POST article comment error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
