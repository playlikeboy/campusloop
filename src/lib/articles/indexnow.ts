import { pingIndexNow } from "@/lib/seo/indexnow";
import { categoryPagePath, isArticleIndexable, type ArticleSeoFields } from "./seo";
import { getCategoryMeta } from "@/constants/articles";

/**
 * Pings IndexNow for an article after a create, edit or publish, but only
 * when search engines may index it (PUBLISHED, seo_status 'index', no redirect).
 * Also pings the hubs that list it.
 */
export function pingArticleIndexNow(article: (ArticleSeoFields & { category?: string | null }) | null | undefined): void {
  if (!article || !isArticleIndexable(article)) return;
  pingIndexNow([
    `/articles/${article.slug}`,
    "/articles",
    categoryPagePath(getCategoryMeta(article.category).slug),
  ]);
}
