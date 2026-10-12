import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  academicResources,
  articles,
  communities,
  events,
  merchants,
  posts,
  userProfiles,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { cleanSnippet, formatTimeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedScope = searchParams.get("scope") === "GLOBAL" || searchParams.get("scope") === "INDIA"
      ? "INDIA"
      : "CAMPUS";

    const db = getDb();
    let userInstitutionId: string | null = null;
    let collegeName = "Your Campus";

    try {
      const user = await hexclaveServerApp.getUser();
      if (user) {
        const profile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, user.id),
          with: { institution: true },
        });
        if (profile?.institutionId) {
          userInstitutionId = profile.institutionId;
          collegeName = profile.institution?.name?.split(",")[0] || "Your Campus";
        }
      }
    } catch {
      // Guest viewer
    }

    // Parallel fetch for all Explore dashboard sections
    const [
      tagRows,
      topPosts,
      previewCommunities,
      upcomingEvents,
      previewAcademics,
      previewArticles,
      previewColleges,
      suggestedPeople,
      previewMerchants,
    ] = await Promise.all([
      // 1. Trending hashtags
      db.execute(
        requestedScope === "CAMPUS" && userInstitutionId
          ? sql`
            SELECT 
              LOWER((regexp_matches(body, '#[a-zA-Z0-9_]+', 'g'))[1]) as tag,
              count(*)::int as count
            FROM posts
            WHERE status = 'PUBLISHED' AND institution_id = ${userInstitutionId}
            GROUP BY 1
            ORDER BY count DESC
            LIMIT 6;
          `
          : sql`
            SELECT 
              LOWER((regexp_matches(body, '#[a-zA-Z0-9_]+', 'g'))[1]) as tag,
              count(*)::int as count
            FROM posts
            WHERE status = 'PUBLISHED'
            GROUP BY 1
            ORDER BY count DESC
            LIMIT 6;
          `
      ).catch(() => ({ rows: [] })),

      // 2. Top Discussions
      db.query.posts.findMany({
        where: and(
          eq(posts.status, "PUBLISHED"),
          requestedScope === "CAMPUS" && userInstitutionId ? eq(posts.institutionId, userInstitutionId) : undefined
        ),
        orderBy: [desc(posts.createdAt)],
        limit: 30,
        with: { author: true, institution: true, votes: true, comments: true },
      }).catch(() => []),

      // 3. Communities
      db.query.communities.findMany({
        limit: 8,
        orderBy: [desc(communities.createdAt)],
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          avatarUrl: true,
          category: true,
          privacy: true,
        },
      }).catch(() => []),

      // 4. Events
      db.query.events.findMany({
        where: eq(events.status, "PUBLISHED"),
        limit: 8,
        orderBy: [desc(events.startDate)],
        columns: {
          id: true,
          slug: true,
          title: true,
          tagline: true,
          clubName: true,
          mode: true,
          venue: true,
          startDate: true,
          bannerUrl: true,
          entryFee: true,
        },
      }).catch(() => []),

      // 5. Academic Vault resources
      db.query.academicResources.findMany({
        limit: 8,
        orderBy: [desc(academicResources.createdAt)],
        columns: {
          id: true,
          title: true,
          subjectCode: true,
          subjectName: true,
          branch: true,
          semester: true,
          resourceType: true,
          downloadsCount: true,
        },
      }).catch(() => []),

      // 6. Articles & Long Reads
      db.query.articles.findMany({
        where: eq(articles.status, "PUBLISHED"),
        limit: 8,
        orderBy: [desc(articles.publishedAt)],
        columns: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          excerpt: true,
          readingTimeMinutes: true,
          coverImageUrl: true,
          category: true,
          publishedAt: true,
        },
        with: {
          author: {
            columns: { displayName: true, username: true, avatarUrl: true },
          },
        },
      }).catch(() => []),

      // 7. Colleges
      db.query.institutions.findMany({
        limit: 8,
        columns: {
          id: true,
          slug: true,
          name: true,
          state: true,
          district: true,
          logoUrl: true,
          nirfRank: true,
        },
      }).catch(() => []),

      // 8. People to follow
      db.query.userProfiles.findMany({
        limit: 8,
        orderBy: [desc(userProfiles.points)],
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          headline: true,
          branch: true,
          points: true,
        },
        with: {
          institution: {
            columns: { name: true },
          },
        },
      }).catch(() => []),

      // 9. Marketplace / Stores
      db.query.merchants.findMany({
        where: eq(merchants.status, "ACTIVE"),
        limit: 8,
        columns: {
          id: true,
          name: true,
          categorySlug: true,
          description: true,
          logoUrl: true,
          address: true,
        },
      }).catch(() => []),
    ]);

    // Format tags
    const rows = (
      Array.isArray(tagRows)
        ? tagRows
        : (tagRows as { rows?: Array<{ tag: string; count: number | string }> })?.rows || []
    ) as Array<{ tag: string; count: number | string }>;

    const trends = rows.map((r) => {
      const clean = r.tag.replace(/^#/, "");
      const formattedTopic = clean ? `#${clean.charAt(0).toUpperCase()}${clean.slice(1)}` : "#";
      return {
        category: requestedScope === "CAMPUS" ? `Trending in ${collegeName}` : "Trending in India",
        topic: formattedTopic,
        postCount: Number(r.count),
        formattedCount: Number(r.count) === 1 ? "1 post" : `${r.count} posts`,
        href: `/hashtag/${encodeURIComponent(clean.toLowerCase())}`,
      };
    });

    // Format top discussions
    const topDiscussions = topPosts
      .map((p) => {
        const score = (p.votes || []).length + (p.comments || []).length * 2;
        return { post: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ post: p }) => {
        const title = cleanSnippet(p.title || p.body, 80) || "Campus Discussion";
        const postTotal = (p.votes || []).length + (p.comments || []).length;
        return {
          id: p.id,
          headline: title,
          category: `Campus Buzz · ${p.institution?.name?.split(",")[0] || collegeName}`,
          timeAgo: formatTimeAgo(p.createdAt),
          postCount: `${postTotal} interactions`,
          authorName: p.isAnonymous ? "Anonymous Student" : p.author?.displayName || "Student",
          authorAvatar: p.isAnonymous ? null : p.author?.avatarUrl || null,
          href: `/post/${p.id}`,
        };
      });

    return NextResponse.json({
      scope: requestedScope,
      collegeName,
      pulse: {
        trends,
        topDiscussions,
      },
      communities: previewCommunities,
      events: upcomingEvents,
      academics: previewAcademics,
      articles: previewArticles,
      colleges: previewColleges,
      people: suggestedPeople,
      marketplace: previewMerchants,
    });
  } catch (error) {
    console.error("Explore home API error:", error);
    return NextResponse.json({ error: "Failed to load explore feed" }, { status: 500 });
  }
}
