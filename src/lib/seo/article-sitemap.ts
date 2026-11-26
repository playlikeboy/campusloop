import { ARTICLE_CATEGORY_LIST } from "@/constants/articles";
import { EDITORIAL_USERNAME } from "@/lib/articles/byline";
import { authorPagePath, categoryPagePath, isArticleIndexable } from "@/lib/articles/seo";
import type { SitemapEntry } from "./sitemap";

export type ArticleSitemapRow = {
  slug: string;
  title: string;
  status: string;
  seoStatus?: string | null;
  redirectToSlug?: string | null;
  updatedAt?: Date | string | null;
  coverImageUrl?: string | null;
};

/**
 * Sitemap entries for /sitemaps/articles.xml. The SQL already filters, and
 * this filters again so a noindex or redirected article can never be listed.
 */
export function articleSitemapEntries(
  rows: ArticleSitemapRow[],
  hubs: {
    /** Category keys with at least one indexable article, with their newest update. */
    categories: { category: string; lastmod?: Date | string | null }[];
    /** Usernames with a public author page. */
    authors: { username: string; lastmod?: Date | string | null }[];
    editorialLastmod?: Date | string | null;
  }
): SitemapEntry[] {
  const articles: SitemapEntry[] = rows.filter(isArticleIndexable).map((item) => ({
    path: `/articles/${item.slug}`,
    lastmod: item.updatedAt,
    changefreq: "weekly",
    priority: 0.9,
    images: item.coverImageUrl ? [{ loc: item.coverImageUrl, title: item.title }] : undefined,
  }));

  const categories: SitemapEntry[] = hubs.categories.flatMap((c) => {
    const meta = ARTICLE_CATEGORY_LIST.find((m) => m.key === c.category);
    return meta ? [{ path: categoryPagePath(meta.slug), lastmod: c.lastmod, changefreq: "daily", priority: 0.7 }] : [];
  });

  const authors: SitemapEntry[] = [
    ...(hubs.editorialLastmod !== undefined
      ? [{ path: authorPagePath(EDITORIAL_USERNAME), lastmod: hubs.editorialLastmod, changefreq: "weekly" as const, priority: 0.5 }]
      : []),
    ...hubs.authors
      .filter((a) => a.username && a.username !== EDITORIAL_USERNAME)
      .map((a) => ({ path: authorPagePath(a.username), lastmod: a.lastmod, changefreq: "weekly" as const, priority: 0.5 })),
  ];

  return [...categories, ...authors, ...articles];
}
