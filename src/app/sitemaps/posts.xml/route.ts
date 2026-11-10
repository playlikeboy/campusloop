import { and, desc, eq, isNull, notInArray, notLike } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { externalPosts, posts } from "@/db/schema";

export const dynamic = "force-dynamic";

const SITEMAP_URL_CAP = 50_000;

export async function GET() {
  try {
    const db = getDb();
    const list = await db
      .select({ id: posts.id, createdAt: posts.createdAt, updatedAt: posts.updatedAt })
      .from(posts)
      // Imported (Reddit/RSS) posts are mirrored content, never canonical here.
      .leftJoin(externalPosts, eq(externalPosts.postId, posts.id))
      .where(
        and(
          eq(posts.status, "PUBLISHED"),
          // Anonymous posts and confessions are never submitted for indexing:
          // they are hidden from public profiles and must stay out of Google.
          eq(posts.isAnonymous, false),
          notInArray(posts.type, ["ANONYMOUS", "CONFESSION"]),
          eq(posts.isSeeded, false),
          notLike(posts.id, "seed\\_202609\\_%"),
          isNull(externalPosts.id)
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(SITEMAP_URL_CAP);

    const urls = list
      .map((item) => {
        const lastmod = (item.updatedAt ?? item.createdAt ?? new Date()).toISOString();
        return `
  <url>
    <loc>https://campusloop.space/post/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=1800, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Posts sitemap error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }
}
