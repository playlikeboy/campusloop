import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { communities } from "@/db/schema";
import { type SitemapEntry, sitemapFromQuery } from "@/lib/seo/sitemap";
import { withSitemapCache } from "@/app/sitemaps/cache-headers";

export const dynamic = "force-dynamic";

const SITEMAP_URL_CAP = 50_000;

const STATIC: SitemapEntry[] = [{ path: "/communities", changefreq: "daily", priority: 0.8 }];

export async function GET() {
  return withSitemapCache(
    await sitemapFromQuery("communities", STATIC, async () => {
      const list = await getDb().query.communities.findMany({
        columns: { id: true, createdAt: true, updatedAt: true },
        // communities/[id] only indexes PUBLIC communities; the sitemap must match.
        where: eq(communities.privacy, "PUBLIC"),
        orderBy: [desc(communities.createdAt)],
        limit: SITEMAP_URL_CAP - STATIC.length,
      });
      return list.map((item) => ({
        path: `/communities/${item.id}`,
        lastmod: item.updatedAt ?? item.createdAt,
        changefreq: "daily",
        priority: 0.8,
      }));
    })
  );
}
