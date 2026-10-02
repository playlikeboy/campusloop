import { ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { academicResources, communities, institutions, userProfiles } from "@/db/schema";
import { getTrendingHashtags } from "@/lib/trending-hashtags";
import type { SearchSuggestionItem } from "@/lib/search/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = (searchParams.get("q") || "").trim();

    if (!rawQ || rawQ.length < 2) {
      return NextResponse.json({ query: rawQ, suggestions: [] });
    }

    const cleanQ = rawQ.replace(/^[@#]/, "").trim() || rawQ;
    const searchPattern = `%${cleanQ}%`;
    const db = getDb();

    // Parallel fetch quick matches
    const [matchingUsers, matchingCommunities, matchingColleges, matchingHashtags, matchingAcademics] = await Promise.all([
      db.query.userProfiles.findMany({
        where: or(
          ilike(userProfiles.username, searchPattern),
          ilike(userProfiles.displayName, searchPattern)
        ),
        limit: 3,
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
        with: {
          institution: {
            columns: { name: true },
          },
        },
      }),

      db.query.communities.findMany({
        where: ilike(communities.name, searchPattern),
        limit: 3,
        columns: {
          id: true,
          name: true,
          category: true,
          avatarUrl: true,
        },
      }),

      db.query.institutions.findMany({
        where: or(
          ilike(institutions.name, searchPattern),
          ilike(institutions.slug, searchPattern)
        ),
        limit: 3,
        columns: {
          id: true,
          slug: true,
          name: true,
          state: true,
          logoUrl: true,
        },
      }),

      getTrendingHashtags({ query: cleanQ, limit: 3 }),

      db.query.academicResources.findMany({
        where: or(
          ilike(academicResources.subjectCode, searchPattern),
          ilike(academicResources.subjectName, searchPattern),
          ilike(academicResources.title, searchPattern)
        ),
        limit: 2,
        columns: {
          id: true,
          title: true,
          subjectCode: true,
          subjectName: true,
        },
      }).catch(() => []),
    ]);

    const suggestions: SearchSuggestionItem[] = [];

    // Query text match
    suggestions.push({
      text: rawQ,
      type: "query",
      title: `Search for "${rawQ}"`,
      href: `/explore?q=${encodeURIComponent(rawQ)}`,
    });

    // Add matching people
    for (const u of matchingUsers) {
      suggestions.push({
        text: `@${u.username}`,
        type: "person",
        title: u.displayName || u.username,
        subtitle: `@${u.username}${u.institution?.name ? ` · ${u.institution.name.split(",")[0]}` : ""}`,
        imageUrl: u.avatarUrl,
        href: `/@${u.username}`,
      });
    }

    // Add matching communities
    for (const c of matchingCommunities) {
      suggestions.push({
        text: c.name,
        type: "community",
        title: c.name,
        subtitle: c.category || "Community",
        imageUrl: c.avatarUrl,
        href: `/communities/${c.id}`,
      });
    }

    // Add matching colleges
    for (const col of matchingColleges) {
      suggestions.push({
        text: col.name,
        type: "college",
        title: col.name,
        subtitle: col.state || "College Hub",
        imageUrl: col.logoUrl,
        href: col.slug ? `/colleges/${col.slug}` : `/colleges/${col.id}`,
      });
    }

    // Add matching hashtags
    for (const tag of matchingHashtags) {
      const clean = tag.tag.replace(/^#/, "").trim();
      suggestions.push({
        text: `#${clean}`,
        type: "hashtag",
        title: `#${clean}`,
        subtitle: `${tag.count} posts`,
        href: `/hashtag/${encodeURIComponent(clean.toLowerCase())}`,
      });
    }

    // Add matching academic materials
    for (const a of matchingAcademics || []) {
      suggestions.push({
        text: a.subjectCode || a.title,
        type: "academic",
        title: `${a.subjectCode ? `${a.subjectCode}: ` : ""}${a.title}`,
        subtitle: a.subjectName || "Academics",
        href: `/academics/search?q=${encodeURIComponent(a.subjectCode || a.title)}`,
      });
    }

    return NextResponse.json({
      query: rawQ,
      suggestions: suggestions.slice(0, 10),
    });
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({ query: "", suggestions: [] });
  }
}
