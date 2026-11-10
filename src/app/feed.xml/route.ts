import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { externalPosts, posts, userProfiles } from "@/db/schema";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";
import { indexablePostsWhere } from "@/lib/seo/public-posts";
import { escapeXml } from "@/lib/seo/sitemap";

type FeedItem = { id: string; title: string | null; body: string; createdAt: Date; username: string | null };

function firstLine(text: string, max = 90): string {
  const line =
    text
      .split("\n")
      .find((l) => l.trim())
      ?.trim() ?? "";
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

function buildRss(items: FeedItem[]): string {
  const body = items
    .map((item) => {
      const link = `${SITE_URL}/post/${item.id}`;
      const title = item.title?.trim() || firstLine(item.body) || `Post by @${item.username ?? "student"}`;
      return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(item.createdAt).toUTCString()}</pubDate>
      <description>${escapeXml(item.body.slice(0, 1000))}</description>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}: latest public posts</title>
    <link>${SITE_URL}</link>
    <description>Recent public posts from students on ${SITE_NAME}.</description>
    <language>en-in</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />${body}
  </channel>
</rss>`;
}

function rssResponse(xml: string, maxAge: number) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge * 2}`,
    },
  });
}

/** Public RSS feed. Uses the same filter as the posts sitemap, so nothing anonymous leaks. */
export async function GET() {
  try {
    const rows = await getDb()
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        createdAt: posts.createdAt,
        username: userProfiles.username,
      })
      .from(posts)
      .leftJoin(externalPosts, eq(externalPosts.postId, posts.id))
      .leftJoin(userProfiles, eq(userProfiles.id, posts.authorId))
      .where(indexablePostsWhere())
      .orderBy(desc(posts.createdAt))
      .limit(20);
    return rssResponse(buildRss(rows), 600);
  } catch (error) {
    console.error("RSS feed error:", error);
    // Still a valid, empty channel so feed readers do not mark it broken.
    return rssResponse(buildRss([]), 120);
  }
}
