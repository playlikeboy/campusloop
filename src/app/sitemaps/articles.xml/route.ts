import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, userProfiles } from "@/db/schema";
import { editorialTopicWhere, indexableArticleWhere } from "@/lib/articles/hub-queries";
import { articleSitemapEntries } from "@/lib/seo/article-sitemap";
import { type SitemapEntry, sitemapFromQuery } from "@/lib/seo/sitemap";
import { withSitemapCache } from "@/app/sitemaps/cache-headers";

export const dynamic = "force-dynamic";

const STATIC: SitemapEntry[] = [{ path: "/articles", changefreq: "daily", priority: 0.8 }];

export async function GET() {
  return withSitemapCache(
    await sitemapFromQuery("articles", STATIC, async () => {
      const db = getDb();
      const indexable = indexableArticleWhere();
      const editorial = editorialTopicWhere();
      const [list, categories, authors, [editorialRow]] = await Promise.all([
        db.query.articles.findMany({
          columns: {
            slug: true,
            updatedAt: true,
            coverImageUrl: true,
            title: true,
            status: true,
            seoStatus: true,
            redirectToSlug: true,
          },
          where: indexable,
          orderBy: [desc(articles.publishedAt)],
          limit: 2000,
        }),
        db
          .select({ category: articles.category, lastmod: sql<Date>`max(${articles.updatedAt})` })
          .from(articles)
          .where(indexable)
          .groupBy(articles.category),
        // Members with at least one indexable article under their own byline.
        db
          .select({ username: userProfiles.username, lastmod: sql<Date>`max(${articles.updatedAt})` })
          .from(articles)
          .innerJoin(userProfiles, eq(userProfiles.id, articles.authorId))
          .where(and(indexable, sql`not (${editorial})`, eq(userProfiles.status, "ACTIVE")))
          .groupBy(userProfiles.username),
        db
          .select({ lastmod: sql<Date | null>`max(${articles.updatedAt})`, n: sql<number>`count(*)::int` })
          .from(articles)
          .where(and(indexable, editorial)),
      ]);
      // Canonical reader URL only; the /a/ short links redirect here.
      return articleSitemapEntries(list, {
        categories,
        authors,
        editorialLastmod: editorialRow && Number(editorialRow.n) > 0 ? editorialRow.lastmod : undefined,
      });
    })
  );
}
