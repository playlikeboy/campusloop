import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  academicPlaylists,
  academicResources,
  articles,
  comments,
  communities,
  events,
  institutions,
  merchants,
  posts,
  userProfiles,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { formatApiFeedPosts } from "@/lib/feed";
import { detectSearchIntent } from "@/lib/search/intent";
import type {
  SearchCategoryFilter,
  SearchResult,
  SearchScope,
} from "@/lib/search/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const rawQ = (searchParams.get("q") || "").trim();
    const scope = (searchParams.get("scope") === "GLOBAL" || searchParams.get("scope") === "INDIA"
      ? "INDIA"
      : "CAMPUS") as SearchScope;
    const type = (searchParams.get("type") || "ALL").toUpperCase() as SearchCategoryFilter;
    const limitParam = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 60);

    if (!rawQ) {
      return NextResponse.json({
        query: "",
        scope,
        filter: type,
        total: 0,
        results: [],
        grouped: {},
        posts: [],
        colleges: [],
        users: [],
        communities: [],
        merchants: [],
        academics: [],
        playlists: [],
        events: [],
        articles: [],
      });
    }

    // Clean search token for symbol-prefixed searches (@username, #tag)
    const cleanQ = rawQ.replace(/^[@#]/, "").trim() || rawQ;
    const searchPattern = `%${cleanQ}%`;
    const prefixPattern = `${cleanQ}%`;
    const intent = detectSearchIntent(rawQ);

    // Resolve viewer's campus for campus scope filtering
    let userInstitutionId: string | null = null;
    try {
      const user = await hexclaveServerApp.getUser();
      if (user) {
        const profile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, user.id),
          columns: { institutionId: true },
        });
        if (profile?.institutionId) {
          userInstitutionId = profile.institutionId;
        }
      }
    } catch {
      // Viewer is guest/unauthenticated
    }

    // Determine entity limits based on whether query asks for ALL or a specific entity
    const isAll = type === "ALL";
    const entityLimit = isAll ? 5 : limitParam;

    // Parallel fetch across entities
    const shouldFetchPeople = isAll || type === "PEOPLE";
    const shouldFetchPosts = isAll || type === "POSTS";
    const shouldFetchCommunities = isAll || type === "COMMUNITIES";
    const shouldFetchColleges = isAll || type === "COLLEGES" || type === "PLACES";
    const shouldFetchEvents = isAll || type === "EVENTS";
    const shouldFetchArticles = isAll || type === "ARTICLES";
    const shouldFetchAcademics = isAll || type === "ACADEMICS";
    const shouldFetchMarketplace = isAll || type === "MARKETPLACE";

    const [
      foundUsers,
      foundPosts,
      foundCommunities,
      foundColleges,
      foundEvents,
      foundArticles,
      foundAcademics,
      foundPlaylists,
      foundMerchants,
    ] = await Promise.all([
      // 1. People / Students
      shouldFetchPeople
        ? db.query.userProfiles.findMany({
            where: or(
              ilike(userProfiles.username, searchPattern),
              ilike(userProfiles.displayName, searchPattern),
              ilike(userProfiles.officialName, searchPattern),
              ilike(userProfiles.headline, searchPattern)
            ),
            limit: entityLimit,
            with: { institution: true },
          })
        : Promise.resolve([]),

      // 2. Posts (published only, optional campus scope)
      shouldFetchPosts
        ? db.query.posts.findMany({
            where: and(
              eq(posts.status, "PUBLISHED"),
              scope === "CAMPUS" && userInstitutionId ? eq(posts.institutionId, userInstitutionId) : undefined,
              or(ilike(posts.body, searchPattern), ilike(posts.title, searchPattern))
            ),
            limit: entityLimit,
            orderBy: [desc(posts.createdAt)],
            with: {
              author: true,
              institution: true,
              community: true,
              votes: true,
              comments: {
                where: eq(comments.status, "PUBLISHED"),
                orderBy: [desc(comments.createdAt)],
                with: { author: true },
              },
              pollOptions: {
                with: { votes: true },
              },
            },
          })
        : Promise.resolve([]),

      // 3. Communities
      shouldFetchCommunities
        ? db.query.communities.findMany({
            where: or(ilike(communities.name, searchPattern), ilike(communities.description, searchPattern)),
            limit: entityLimit,
          })
        : Promise.resolve([]),

      // 4. Colleges / Institutions
      shouldFetchColleges
        ? db.query.institutions.findMany({
            where: or(
              ilike(institutions.name, searchPattern),
              ilike(institutions.slug, searchPattern),
              ilike(institutions.state, searchPattern),
              ilike(institutions.district, searchPattern)
            ),
            limit: entityLimit,
          })
        : Promise.resolve([]),

      // 5. Events
      shouldFetchEvents
        ? db.query.events.findMany({
            where: and(
              eq(events.status, "PUBLISHED"),
              or(
                ilike(events.title, searchPattern),
                ilike(events.clubName, searchPattern),
                ilike(events.tagline, searchPattern),
                ilike(events.description, searchPattern)
              )
            ),
            limit: entityLimit,
            orderBy: [desc(events.startDate)],
          })
        : Promise.resolve([]),

      // 6. Articles
      shouldFetchArticles
        ? db.query.articles.findMany({
            where: and(
              eq(articles.status, "PUBLISHED"),
              or(
                ilike(articles.title, searchPattern),
                ilike(articles.subtitle, searchPattern),
                ilike(articles.excerpt, searchPattern)
              )
            ),
            limit: entityLimit,
            orderBy: [desc(articles.publishedAt)],
            with: { author: true },
          })
        : Promise.resolve([]),

      // 7. Academic Resources
      shouldFetchAcademics
        ? db.query.academicResources.findMany({
            where: or(
              ilike(academicResources.title, searchPattern),
              ilike(academicResources.subjectName, searchPattern),
              ilike(academicResources.subjectCode, searchPattern),
              ilike(academicResources.description, searchPattern)
            ),
            limit: entityLimit,
            orderBy: [desc(academicResources.createdAt)],
            with: { institution: true, uploader: true },
          })
        : Promise.resolve([]),

      // 8. Academic Playlists
      shouldFetchAcademics
        ? db.query.academicPlaylists.findMany({
            where: or(
              ilike(academicPlaylists.title, searchPattern),
              ilike(academicPlaylists.description, searchPattern)
            ),
            limit: entityLimit,
            orderBy: [desc(academicPlaylists.createdAt)],
            with: { creator: true },
          })
        : Promise.resolve([]),

      // 9. Merchants / Stores
      shouldFetchMarketplace
        ? db.query.merchants.findMany({
            where: and(
              eq(merchants.status, "ACTIVE"),
              or(
                ilike(merchants.name, searchPattern),
                ilike(merchants.description, searchPattern),
                ilike(merchants.address, searchPattern)
              )
            ),
            limit: entityLimit,
          })
        : Promise.resolve([]),
    ]);

    const formattedPosts = await formatApiFeedPosts(foundPosts as any);

    // Build Normalized Search Results
    const normalizedPeople: SearchResult[] = foundUsers.map((u) => {
      const isExact = u.username.toLowerCase() === cleanQ.toLowerCase();
      const isPrefix = u.username.toLowerCase().startsWith(cleanQ.toLowerCase());
      return {
        id: u.id,
        type: "person",
        title: u.displayName || u.username,
        subtitle: `@${u.username}${u.institution?.name ? ` · ${u.institution.name.split(",")[0]}` : ""}`,
        description: u.headline || u.bio || undefined,
        imageUrl: u.avatarUrl,
        href: `/${u.username}`,
        metadata: {
          course: u.course || "",
          branch: u.branch || "",
          points: String(u.points || 0),
        },
        score: isExact ? 100 : isPrefix ? 80 : 50,
      };
    });

    const normalizedPosts: SearchResult[] = (formattedPosts as any[]).map((p) => {
      const author = p.author;
      const subtitle = p.isAnonymous ? "Anonymous Confession" : author?.displayName || (author?.username ? `@${author.username}` : "Student");
      const media = p.mediaUrls?.[0] || p.media?.[0]?.url || p.externalPost?.media?.[0]?.url || null;
      return {
        id: p.id,
        type: "post",
        title: p.title || p.body.slice(0, 90),
        subtitle,
        description: p.body,
        imageUrl: media,
        href: `/post/${p.id}`,
        metadata: {
          type: p.type,
          votes: String(p.votesCount || 0),
          comments: String(p.commentsCount || 0),
        },
        score: 40,
      };
    });

    const normalizedCommunities: SearchResult[] = foundCommunities.map((c) => ({
      id: c.id,
      type: "community",
      title: c.name,
      subtitle: c.category || "Campus Community",
      description: c.description || undefined,
      imageUrl: c.avatarUrl,
      href: `/communities/${c.id}`,
      metadata: {
        privacy: c.privacy,
      },
      score: c.name.toLowerCase() === cleanQ.toLowerCase() ? 95 : 60,
    }));

    const normalizedColleges: SearchResult[] = foundColleges.map((col) => ({
      id: col.id,
      type: "college",
      title: col.name,
      subtitle: [col.district, col.state].filter(Boolean).join(", ") || "Indian College Hub",
      description: col.description || undefined,
      imageUrl: col.logoUrl,
      href: col.slug ? `/colleges/${col.slug}` : `/colleges/${col.id}`,
      metadata: {
        nirfRank: col.nirfRank ? `#${col.nirfRank}` : "",
      },
      score: col.name.toLowerCase().includes(cleanQ.toLowerCase()) ? 70 : 40,
    }));

    const normalizedEvents: SearchResult[] = foundEvents.map((ev) => ({
      id: ev.id,
      type: "event",
      title: ev.title,
      subtitle: `${ev.clubName} · ${ev.mode}`,
      description: ev.tagline || ev.description.slice(0, 120),
      imageUrl: ev.bannerUrl,
      href: `/events/${ev.slug || ev.id}`,
      metadata: {
        venue: ev.venue || "Campus Venue",
        startDate: ev.startDate.toISOString(),
      },
      score: 65,
    }));

    const normalizedArticles: SearchResult[] = foundArticles.map((art) => ({
      id: art.id,
      type: "article",
      title: art.title,
      subtitle: `By ${art.author?.displayName || "Student"} · ${art.readingTimeMinutes} min read`,
      description: art.excerpt || art.subtitle || undefined,
      imageUrl: art.coverImageUrl,
      href: `/articles/${art.slug}`,
      metadata: {
        category: art.category,
      },
      score: 60,
    }));

    const normalizedAcademics: SearchResult[] = foundAcademics.map((res) => ({
      id: res.id,
      type: "academic",
      title: res.title,
      subtitle: `${res.subjectCode}: ${res.subjectName} · ${res.resourceType}`,
      description: res.description || undefined,
      href: `/academics/${res.id}`,
      metadata: {
        branch: res.branch,
        semester: String(res.semester),
        downloads: String(res.downloadsCount),
      },
      score: 65,
    }));

    const normalizedStores: SearchResult[] = foundMerchants.map((m) => ({
      id: m.id,
      type: "store",
      title: m.name,
      subtitle: m.categorySlug || "Campus Store & Canteen",
      description: m.description || m.address || undefined,
      imageUrl: m.logoUrl,
      href: `/marketplace`,
      metadata: {
        address: m.address || "",
      },
      score: 55,
    }));

    // Grouping
    const grouped: Record<string, SearchResult[]> = {
      people: normalizedPeople,
      posts: normalizedPosts,
      communities: normalizedCommunities,
      colleges: normalizedColleges,
      events: normalizedEvents,
      articles: normalizedArticles,
      academics: normalizedAcademics,
      stores: normalizedStores,
    };

    // Flatten all results sorted by relevance score
    const allResults = [
      ...normalizedPeople,
      ...normalizedPosts,
      ...normalizedCommunities,
      ...normalizedColleges,
      ...normalizedEvents,
      ...normalizedArticles,
      ...normalizedAcademics,
      ...normalizedStores,
    ].sort((a, b) => (b.score || 0) - (a.score || 0));

    return NextResponse.json({
      query: rawQ,
      scope,
      filter: type,
      intent,
      total: allResults.length,
      results: isAll ? allResults : (grouped[type.toLowerCase()] || allResults),
      grouped,
      // Backward compatibility keys
      posts: formattedPosts,
      colleges: foundColleges,
      users: foundUsers,
      communities: foundCommunities,
      merchants: foundMerchants,
      academics: foundAcademics,
      playlists: foundPlaylists,
      events: foundEvents,
      articles: foundArticles,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
