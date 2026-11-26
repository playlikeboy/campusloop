import { and, desc, eq, inArray, isNull, not, or, type SQL, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { EDITORIAL_CATEGORIES, EDITORIAL_TOPIC_PATTERN } from "./byline";

/**
 * Queries behind the crawlable article hubs (category pages, author pages,
 * sitemap). Every hub lists only articles that search engines may index.
 */

/** PUBLISHED, seo_status 'index', not redirected. */
export function indexableArticleWhere(): SQL {
  return and(eq(articles.status, "PUBLISHED"), eq(articles.seoStatus, "index"), isNull(articles.redirectToSlug)) as SQL;
}

/** Same rule as `isEditorialTopic()` in byline.ts, in SQL. */
export function editorialTopicWhere(): SQL {
  return or(
    inArray(articles.category, [...EDITORIAL_CATEGORIES]),
    sql`${articles.title} ~* ${EDITORIAL_TOPIC_PATTERN}`,
    sql`translate(${articles.tags}::text, '-', ' ') ~* ${EDITORIAL_TOPIC_PATTERN}`
  ) as SQL;
}

const LIST_COLUMNS = {
  slug: true,
  title: true,
  subtitle: true,
  excerpt: true,
  category: true,
  readingTimeMinutes: true,
  publishedAt: true,
  updatedAt: true,
  coverImageUrl: true,
} as const;

export async function listArticles(where: SQL, page: number, pageSize: number) {
  const db = getDb();
  const [rows, [{ total }]] = await Promise.all([
    db.query.articles.findMany({
      columns: LIST_COLUMNS,
      where,
      orderBy: [desc(articles.publishedAt), desc(articles.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db.select({ total: sql<number>`count(*)::int` }).from(articles).where(where),
  ]);
  return { rows, total: Number(total) || 0, totalPages: Math.max(1, Math.ceil((Number(total) || 0) / pageSize)) };
}

export function categoryArticlesWhere(categoryKey: string): SQL {
  return and(indexableArticleWhere(), eq(articles.category, categoryKey)) as SQL;
}

export function editorialArticlesWhere(): SQL {
  return and(indexableArticleWhere(), editorialTopicWhere()) as SQL;
}

/** Articles credited to this member (their own, minus the ones shown under the editorial byline). */
export function personArticlesWhere(authorId: string): SQL {
  return and(indexableArticleWhere(), eq(articles.authorId, authorId), not(editorialTopicWhere())) as SQL;
}

/** Category counts of indexable articles, for "topics written" and the hub index. */
export async function categoryCounts(where: SQL): Promise<{ category: string; n: number }[]> {
  const rows = await getDb()
    .select({ category: articles.category, n: sql<number>`count(*)::int` })
    .from(articles)
    .where(where)
    .groupBy(articles.category)
    .orderBy(sql`count(*) desc`);
  return rows.map((r) => ({ category: r.category, n: Number(r.n) }));
}
