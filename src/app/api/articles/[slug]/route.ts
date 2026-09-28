import { and, eq, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { articles, articleVotes, savedArticles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { awardPoints } from "@/lib/gamification-server";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const db = getDb();
    const user = await hexclaveServerApp.getUser();

    let currentProfile = null;
    if (user) {
      currentProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });
    }

    const article = await db.query.articles.findFirst({
      where: or(eq(articles.slug, slug), eq(articles.id, slug)),
      with: {
        author: {
          with: { institution: true },
        },
        institution: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Security: drafts and archived articles are strictly private to author or admin
    const isAuthor = currentProfile?.id === article.authorId;
    const isAdmin = currentProfile?.role === "ADMIN";
    if (article.status !== "PUBLISHED" && !isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check user vote & saved state
    let userVote = 0;
    let isSaved = false;

    if (currentProfile) {
      const [vote, saved] = await Promise.all([
        db.query.articleVotes.findFirst({
          where: and(eq(articleVotes.articleId, article.id), eq(articleVotes.profileId, currentProfile.id)),
        }),
        db.query.savedArticles.findFirst({
          where: and(eq(savedArticles.articleId, article.id), eq(savedArticles.profileId, currentProfile.id)),
        }),
      ]);

      if (vote) userVote = vote.value;
      if (saved) isSaved = true;
    }

    return NextResponse.json({
      article: {
        ...article,
        userVote,
        isSaved,
      },
    });
  } catch (error) {
    console.error("GET /api/articles/[slug] error:", error);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return handleUpdate(req, params);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return handleUpdate(req, params);
}

async function handleUpdate(req: NextRequest, paramsPromise: Promise<{ slug: string }>) {
  try {
    const { slug } = await paramsPromise;
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const currentProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!currentProfile) {
      return NextResponse.json({ error: "Profile required" }, { status: 404 });
    }

    const blocked = await rejectViewerWrite(currentProfile);
    if (blocked) return blocked;

    const article = await db.query.articles.findFirst({
      where: or(eq(articles.slug, slug), eq(articles.id, slug)),
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.authorId !== currentProfile.id && currentProfile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Not the author" }, { status: 403 });
    }

    const body = (await req.json()) as Record<string, any>;
    const { title, subtitle, content, coverImageUrl, category, tags, status } = body;

    const targetContent = content !== undefined ? content : article.content;
    const words = targetContent.trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    const plainText = targetContent
      .replace(/<[^>]*>/g, "")
      .replace(/#+\s+/g, "")
      .replace(/[*_~`]/g, "")
      .trim();
    const excerpt = plainText.slice(0, 160) + (plainText.length > 160 ? "..." : "");

    const updateData: any = {
      updatedAt: new Date(),
      readingTimeMinutes: readingTime,
      excerpt,
    };

    if (title) updateData.title = title.trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle?.trim() || null;
    if (content !== undefined) updateData.content = content;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl?.trim() || null;
    if (category) updateData.category = category;
    if (tags && Array.isArray(tags)) updateData.tags = tags;

    const wasDraft = article.status === "DRAFT";
    const isNowPublishing = status === "PUBLISHED";

    if (status) {
      updateData.status = status;
      if (isNowPublishing && !article.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    await db.update(articles).set(updateData).where(eq(articles.id, article.id));

    // Award +15 LP idempotently if transitioning from DRAFT to PUBLISHED
    if (wasDraft && isNowPublishing) {
      try {
        await awardPoints(currentProfile.id, 15, "ARTICLE_PUBLISHED", {
          referenceId: article.id,
          actorId: currentProfile.id,
        });
      } catch (e) {
        console.warn("Failed to award publication LP on update:", e);
      }
    }

    return NextResponse.json({
      message: "Article updated successfully",
      article: { ...article, ...updateData },
    });
  } catch (error) {
    console.error("PUT/PATCH /api/articles/[slug] error:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const currentProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!currentProfile) {
      return NextResponse.json({ error: "Profile required" }, { status: 404 });
    }

    const article = await db.query.articles.findFirst({
      where: or(eq(articles.slug, slug), eq(articles.id, slug)),
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.authorId !== currentProfile.id && currentProfile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Not the author" }, { status: 403 });
    }

    await db.delete(articles).where(eq(articles.id, article.id));

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/articles/[slug] error:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
