import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { academicResources, courses } from "@/db/schema";
import { categorySlug } from "@/lib/courses/catalog-params";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const list = await db.query.academicResources.findMany({
      columns: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [desc(academicResources.createdAt)],
      limit: 25000,
    });

    const rootUrl = `
  <url>
    <loc>https://campusloop.space/academics</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://campusloop.space/academics/study-material/sources</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

    const urls = list
      .map((item) => {
        const lastMod = (item.updatedAt || item.createdAt || new Date()).toISOString().split("T")[0];
        return `
  <url>
    <loc>https://campusloop.space/academics/study-material/${item.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join("");

    // Courses live alongside study material in the Academics section.
    const courseRows = await db
      .select({ slug: courses.slug, updatedAt: courses.updatedAt, category: courses.category })
      .from(courses)
      .where(and(eq(courses.status, "PUBLISHED"), eq(courses.listed, true)))
      .catch(() => []);
    const courseUrls =
      `
  <url>
    <loc>https://campusloop.space/courses</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>` +
      [...new Set(courseRows.map((c) => c.category))]
        .map(
          (cat) => `
  <url>
    <loc>https://campusloop.space/courses/category/${categorySlug(cat)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
        )
        .join("") +
      courseRows
        .map(
          (c) => `
  <url>
    <loc>https://campusloop.space/courses/${c.slug}</loc>
    <lastmod>${c.updatedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
        )
        .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rootUrl}${courseUrls}${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=18000",
      },
    });
  } catch (error) {
    console.error("Academics sitemap error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://campusloop.space/academics</loc><priority>1.0</priority></url></urlset>`,
      { headers: { "Content-Type": "application/xml; charset=utf-8" } }
    );
  }
}
