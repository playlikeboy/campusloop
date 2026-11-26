import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { type SitemapEntry, sitemapFromQuery } from "@/lib/seo/sitemap";
import { withSitemapCache } from "@/app/sitemaps/cache-headers";

export const dynamic = "force-dynamic";

const STATIC: SitemapEntry[] = [{ path: "/events", changefreq: "daily", priority: 0.8 }];

export async function GET() {
  return withSitemapCache(
    await sitemapFromQuery("events", STATIC, async () => {
      const list = await getDb().query.events.findMany({
        columns: { id: true, slug: true, updatedAt: true },
        // Unlisted and college-only events are noindex on the page, so keep them out here too.
        where: and(eq(events.status, "PUBLISHED"), eq(events.visibility, "PUBLIC")),
        orderBy: [desc(events.startDate)],
        limit: 2000,
      });
      // Public `/e/` form only — `/app/events/...` is behind the auth gate.
      return list.map((item) => ({
        path: `/e/${item.slug || item.id}`,
        lastmod: item.updatedAt,
        changefreq: "daily",
        priority: 0.9,
      }));
    })
  );
}
