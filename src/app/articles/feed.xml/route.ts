import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ARTICLES_CANONICAL_HOST, ARTICLES_SUBTITLE } from "@/constants/articles";
import { getDb } from "@/db";
import { articles } from "@/db/schema";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rssDocument(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CampusLoop Articles</title>
    <link>${ARTICLES_CANONICAL_HOST}/articles</link>
    <description>${escapeXml(ARTICLES_SUBTITLE)}</description>
    <language>en-in</language>
    <atom:link href="${ARTICLES_CANONICAL_HOST}/articles/feed.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;
}

export async function GET() {
  try {
    const db = getDb();
    const list = await db.query.articles.findMany({
      where: eq(articles.status, "PUBLISHED"),
      orderBy: [desc(articles.publishedAt)],
      limit: 30,
      with: {
        author: { columns: { displayName: true, username: true } },
      },
    });

    let items = "";
    for (const item of list) {
      const title = escapeXml(item.title);
      const link = `${ARTICLES_CANONICAL_HOST}/articles/${item.slug}`;
      const description = escapeXml(item.excerpt || item.subtitle || item.title);
      const pubDate = (item.publishedAt || item.createdAt).toUTCString();
      const author = escapeXml(item.author?.displayName || `@${item.author?.username || "writer"}`);
      const category = escapeXml(item.category || "GENERAL");

      items += `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${author}</author>
      <category>${category}</category>
      <description>${description}</description>
    </item>`;
    }

    const xml = rssDocument(items);

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Articles RSS feed error:", error);
    // Still a valid feed, so readers keep the subscription instead of erroring.
    return new NextResponse(rssDocument(""), {
      headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
    });
  }
}
