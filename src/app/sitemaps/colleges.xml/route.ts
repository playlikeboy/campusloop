import { desc, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { institutions } from "@/db/schema";
import { type SitemapEntry, sitemapFromQuery } from "@/lib/seo/sitemap";
import { VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const SITEMAP_URL_CAP = 50_000;

const STATIC: SitemapEntry[] = [{ path: "/colleges", changefreq: "daily", priority: 0.9 }];

export function GET() {
  return sitemapFromQuery(
    "colleges",
    STATIC,
    async () => {
      const list = await getDb().query.institutions.findMany({
        columns: { id: true, slug: true, createdAt: true, updatedAt: true },
        // The reserved Viewer Hub is internal plumbing for personal-email
        // accounts, not a real campus — it must never be handed to Google.
        where: ne(institutions.slug, VIEWER_INSTITUTION_SLUG),
        orderBy: [desc(institutions.createdAt)],
        limit: SITEMAP_URL_CAP - STATIC.length,
      });
      return list.map((item) => ({
        path: `/college/${item.slug || item.id}`,
        lastmod: item.updatedAt ?? item.createdAt,
        changefreq: "daily",
        priority: 0.9,
      }));
    },
    43200
  );
}
