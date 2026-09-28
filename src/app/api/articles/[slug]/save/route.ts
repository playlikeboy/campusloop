import { and, eq, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { articles, savedArticles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ isSaved: false });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ isSaved: false });
    }

    const article = await db.query.articles.findFirst({
      where: or(eq(articles.slug, slug), eq(articles.id, slug)),
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const saved = await db.query.savedArticles.findFirst({
      where: and(eq(savedArticles.articleId, article.id), eq(savedArticles.profileId, profile.id)),
    });

    return NextResponse.json({ isSaved: Boolean(saved) });
  } catch (error) {
    console.error("GET /api/articles/[slug]/save error:", error);
    return NextResponse.json({ error: "Failed to get saved status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile required" }, { status: 404 });
    }

    const article = await db.query.articles.findFirst({
      where: or(eq(articles.slug, slug), eq(articles.id, slug)),
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const existing = await db.query.savedArticles.findFirst({
      where: and(eq(savedArticles.articleId, article.id), eq(savedArticles.profileId, profile.id)),
    });

    let nextSaved = false;

    if (existing) {
      await db.delete(savedArticles).where(eq(savedArticles.id, existing.id));
      nextSaved = false;
    } else {
      await db.insert(savedArticles).values({
        id: `sa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        articleId: article.id,
        profileId: profile.id,
        createdAt: new Date(),
      });
      nextSaved = true;
    }

    return NextResponse.json({
      isSaved: nextSaved,
      message: nextSaved ? "Saved to reading list" : "Removed from reading list",
    });
  } catch (error) {
    console.error("POST /api/articles/[slug]/save error:", error);
    return NextResponse.json({ error: "Failed to update saved status" }, { status: 500 });
  }
}
