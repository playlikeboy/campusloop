import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { type SitemapEntry, sitemapFromQuery } from "@/lib/seo/sitemap";

export const dynamic = "force-dynamic";

const STATIC: SitemapEntry[] = [{ path: "/articles", changefreq: "daily", priority: 0.8 }];

export function GET() {
  return sitemapFromQuery("articles", STATIC, async () => {
    const list = await getDb().query.articles.findMany({
      columns: { slug: true, updatedAt: true, coverImageUrl: true, title: true },
      where: eq(articles.status, "PUBLISHED"),
      orderBy: [desc(articles.publishedAt)],
      limit: 2000,
    });
    // Canonical reader URL only; the /a/ short links redirect here.
    return list.map((item) => ({
      path: `/articles/${item.slug}`,
      lastmod: item.updatedAt,
      changefreq: "weekly",
      priority: 0.9,
      images: item.coverImageUrl ? [{ loc: item.coverImageUrl, title: item.title }] : undefined,
    }));
  });
}
