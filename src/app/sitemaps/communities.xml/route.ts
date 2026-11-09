import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { communities } from "@/db/schema";

export const dynamic = "force-dynamic";

const SITEMAP_URL_CAP = 50_000;

export async function GET() {
  try {
    const db = getDb();
    const list = await db.query.communities.findMany({
      columns: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
      // communities/[id] only indexes PUBLIC communities; the sitemap must match.
      where: eq(communities.privacy, "PUBLIC"),
      orderBy: [desc(communities.createdAt)],
      limit: SITEMAP_URL_CAP,
    });

    const urls = list
      .map((item) => {
        const lastmod = (item.updatedAt ?? item.createdAt ?? new Date()).toISOString();
        return `
  <url>
    <loc>https://campusloop.space/communities/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
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
    console.error("Communities sitemap error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }
}
