import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { articles, articleVotes, follows, savedArticles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { awardPoints } from "@/lib/gamification-server";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function createExcerpt(content: string): string {
  const plainText = content
    .replace(/<[^>]*>/g, "")
    .replace(/#+\s+/g, "")
    .replace(/[*_~`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
  return plainText.slice(0, 160) + (plainText.length > 160 ? "..." : "");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "12", 10)), 50);
    const offset = (page - 1) * limit;

    const feed = searchParams.get("feed") || ""; // for_you, latest, trending, following, saved
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const query = searchParams.get("q");
    const scope = searchParams.get("scope") || "GLOBAL";
    const sort = searchParams.get("sort") || "latest"; // latest, popular, trending
    const status = searchParams.get("status") || "PUBLISHED";
    const authorId = searchParams.get("authorId");

    const user = await hexclaveServerApp.getUser();
    const db = getDb();

    let currentProfile = null;
    if (user) {
      currentProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });
    }

    // Security: Only the author can query drafts or archived articles
    const isOwnerQuery = Boolean(authorId && currentProfile?.id === authorId);
    const effectiveStatus = isOwnerQuery ? status : "PUBLISHED";

    const conditions: any[] = [eq(articles.status, effectiveStatus)];

    if (authorId) {
      conditions.push(eq(articles.authorId, authorId));
    }

    if (scope === "CAMPUS" && currentProfile?.institutionId) {
      conditions.push(eq(articles.institutionId, currentProfile.institutionId));
    }

    if (category && category !== "ALL") {
      conditions.push(eq(articles.category, category));
    }

    // Real tag filtering
    if (tag) {
      const cleanTag = tag.replace(/^#/, "").trim().toLowerCase();
      if (cleanTag) {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(COALESCE(${articles.tags}, '[]'::jsonb)) AS elem
            WHERE LOWER(elem) = ${cleanTag}
          )`
        );
      }
    }

    // Real search across title, subtitle, excerpt, content, and tags
    if (query?.trim()) {
      const pattern = `%${query.trim()}%`;
      conditions.push(
        or(
          ilike(articles.title, pattern),
          ilike(articles.subtitle, pattern),
          ilike(articles.excerpt, pattern),
          ilike(articles.content, pattern),
          sql`${articles.tags}::text ILIKE ${pattern}`
        )
      );
    }

    // Feed tabs logic
    if (feed === "saved") {
      if (!currentProfile) {
        return NextResponse.json({ articles: [], page, hasMore: false });
      }
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM saved_articles
          WHERE saved_articles.article_id = ${articles.id}
          AND saved_articles.profile_id = ${currentProfile.id}
        )`
      );
    } else if (feed === "following") {
      if (!currentProfile) {
        return NextResponse.json({ articles: [], page, hasMore: false });
      }
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM follows
          WHERE follows.follower_id = ${currentProfile.id}
          AND follows.following_id = ${articles.authorId}
        )`
      );
    }

    // Sorting clauses
    let orderByClause: any[] = [desc(articles.publishedAt)];
    if (sort === "popular") {
      orderByClause = [desc(articles.upvotesCount), desc(articles.viewsCount)];
    } else if (sort === "trending" || feed === "trending") {
      // Deterministic time-decayed trending score: upvotes + views with recency weight
      orderByClause = [
        sql`(${articles.upvotesCount} * 4 + ${articles.viewsCount}) / POWER(EXTRACT(EPOCH FROM (NOW() - COALESCE(${articles.publishedAt}, ${articles.createdAt}))) / 3600 + 2, 1.4) DESC`,
        desc(articles.publishedAt),
      ];
    } else if (feed === "for_you" && currentProfile?.institutionId) {
      // Personalization: prioritize articles from the same campus, then high engagement and recency
      orderByClause = [
        sql`CASE WHEN ${articles.institutionId} = ${currentProfile.institutionId} THEN 1 ELSE 0 END DESC`,
        desc(articles.upvotesCount),
        desc(articles.publishedAt),
      ];
    }

    const articleList = await db.query.articles.findMany({
      where: and(...conditions),
      orderBy: orderByClause,
      limit,
      offset,
      columns: { content: false },
      with: {
        author: {
          with: { institution: true },
        },
        institution: true,
      },
    });

    // Check viewer votes and saved state
    const userVotesMap: Record<string, number> = {};
    const savedSet = new Set<string>();

    if (currentProfile && articleList.length > 0) {
      const articleIds = articleList.map((a) => a.id);

      const [userVotes, userSaves] = await Promise.all([
        db.query.articleVotes.findMany({
          where: and(
            eq(articleVotes.profileId, currentProfile.id),
            inArray(articleVotes.articleId, articleIds)
          ),
        }),
        db.query.savedArticles.findMany({
          where: and(
            eq(savedArticles.profileId, currentProfile.id),
            inArray(savedArticles.articleId, articleIds)
          ),
        }),
      ]);

      userVotes.forEach((v) => {
        userVotesMap[v.articleId] = v.value;
      });
      userSaves.forEach((s) => {
        savedSet.add(s.articleId);
      });
    }

    const enriched = articleList.map((art) => ({
      ...art,
      userVote: userVotesMap[art.id] || 0,
      isSaved: savedSet.has(art.id),
    }));

    return NextResponse.json({
      articles: enriched,
      page,
      hasMore: articleList.length === limit,
    });
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      with: { institution: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile required" }, { status: 404 });
    }

    // Server-side Viewer Mode protection
    const blocked = await rejectViewerWrite(profile);
    if (blocked) return blocked;

    const body = (await req.json()) as Record<string, any>;
    const {
      title,
      subtitle,
      content,
      coverImageUrl,
      category = "GENERAL",
      tags = [],
      status = "PUBLISHED",
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Article title is required" }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: "Article content is required" }, { status: 400 });
    }

    // Deterministic slug generation with collision avoidance
    const baseSlug = slugify(title) || "article";
    let finalSlug = baseSlug;
    let collisionCount = 1;

    while (true) {
      const existing = await db.query.articles.findFirst({
        where: eq(articles.slug, finalSlug),
      });
      if (!existing) break;
      collisionCount++;
      finalSlug = `${baseSlug}-${collisionCount}`;
    }

    const readingTime = calculateReadingTime(content);
    const excerpt = createExcerpt(content);
    const articleId = `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newArticle = {
      id: articleId,
      slug: finalSlug,
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      content,
      excerpt,
      coverImageUrl: coverImageUrl?.trim() || null,
      authorId: profile.id,
      institutionId: profile.institutionId || null,
      category,
      tags: Array.isArray(tags) ? tags : [],
      readingTimeMinutes: readingTime,
      viewsCount: 0,
      upvotesCount: 0,
      downvotesCount: 0,
      isFeatured: false,
      status: status === "DRAFT" ? "DRAFT" : "PUBLISHED",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(articles).values(newArticle);

    // Award clout Loop Points (+15 LP) idempotently on publish
    if (status === "PUBLISHED") {
      try {
        await awardPoints(profile.id, 15, "ARTICLE_PUBLISHED", {
          referenceId: articleId,
          actorId: profile.id,
        });
      } catch (e) {
        console.warn("Failed to award LP for article:", e);
      }
    }

    return NextResponse.json({
      article: newArticle,
      message: status === "DRAFT" ? "Draft saved successfully" : "Article published successfully!",
    });
  } catch (error) {
    console.error("POST /api/articles error:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
