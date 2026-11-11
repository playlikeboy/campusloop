import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { academicResources, courses } from "@/db/schema";
import { categorySlug } from "@/lib/courses/catalog-params";
import { type SitemapEntry, sitemapFromQuery } from "@/lib/seo/sitemap";
import { withSitemapCache } from "@/app/sitemaps/cache-headers";

export const dynamic = "force-dynamic";

const STATIC: SitemapEntry[] = [
  { path: "/academics", changefreq: "daily", priority: 1.0 },
  { path: "/academics/study-material/sources", changefreq: "daily", priority: 0.9 },
  { path: "/courses", changefreq: "daily", priority: 0.9 },
];

export async function GET() {
  return withSitemapCache(
    await sitemapFromQuery(
      "academics",
      STATIC,
      async () => {
        const db = getDb();
        const [resources, courseRows] = await Promise.all([
          db.query.academicResources.findMany({
            columns: { id: true, createdAt: true, updatedAt: true },
            orderBy: [desc(academicResources.createdAt)],
            limit: 25000,
          }),
          // Courses live alongside study material in the Academics section.
          db
            .select({ slug: courses.slug, updatedAt: courses.updatedAt, category: courses.category })
            .from(courses)
            .where(and(eq(courses.status, "PUBLISHED"), eq(courses.listed, true)))
            .catch(() => []),
        ]);

        const categories: SitemapEntry[] = [...new Set(courseRows.map((c) => c.category))].map((cat) => ({
          path: `/courses/category/${categorySlug(cat)}`,
          changefreq: "daily",
          priority: 0.8,
        }));
        const courseEntries: SitemapEntry[] = courseRows.map((c) => ({
          path: `/courses/${c.slug}`,
          lastmod: c.updatedAt,
          changefreq: "weekly",
          priority: 0.8,
        }));
        const resourceEntries: SitemapEntry[] = resources.map((r) => ({
          path: `/academics/study-material/${r.id}`,
          lastmod: r.updatedAt ?? r.createdAt,
          changefreq: "weekly",
          priority: 0.8,
        }));
        return [...categories, ...courseEntries, ...resourceEntries];
      },
      3600
    )
  );
}
