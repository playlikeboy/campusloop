import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { comments } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const list = await db.query.comments.findMany({
      columns: {
        id: true,
        postId: true,
        createdAt: true,
        updatedAt: true,
      },
      // Anonymous comments are not indexed to protect student anonymity
      where: and(eq(comments.status, "PUBLISHED"), eq(comments.isAnonymous, false)),
      orderBy: [desc(comments.createdAt)],
      limit: 500,
    });

    const urls = list
      .map((item) => {
        const lastmod = item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : item.createdAt
            ? new Date(item.createdAt).toISOString()
            : new Date().toISOString();

        return `
  <url>
    <loc>https://campusloop.space/post/${item.postId}/comment/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
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
    console.error("Comments sitemap error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }
}
