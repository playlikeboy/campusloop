import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { externalPosts, posts } from "@/db/schema";
import { indexablePostsWhere } from "@/lib/seo/public-posts";
import { sitemapFromQuery } from "@/lib/seo/sitemap";
import { withSitemapCache } from "@/app/sitemaps/cache-headers";
import { cleanSnippet } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SITEMAP_URL_CAP = 50_000;

export async function GET() {
  return withSitemapCache(
    await sitemapFromQuery("posts", [], async () => {
      const list = await getDb()
        .select({
          id: posts.id,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          head: sql<string>`left(${posts.body}, 600)`,
        })
        .from(posts)
        .leftJoin(externalPosts, eq(externalPosts.postId, posts.id))
        .where(indexablePostsWhere())
        .orderBy(desc(posts.createdAt))
        .limit(SITEMAP_URL_CAP);
      // The post page marks a post noindex when its text without markdown, links
      // and media is under 40 characters, so leave those out here too.
      return list.filter((item) => cleanSnippet(item.head, 155).length >= 40).map((item) => ({
        path: `/post/${item.id}`,
        lastmod: item.updatedAt ?? item.createdAt,
        changefreq: "weekly",
        priority: 0.6,
      }));
    })
  );
}
