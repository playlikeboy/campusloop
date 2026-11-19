import { and, desc, ne, sql } from "drizzle-orm";
import { COLLEGE_INDEX_RULE } from "@/components/colleges/college-facts";
import { getDb } from "@/db";
import { academicResources, institutions, posts, userProfiles } from "@/db/schema";
import { type SitemapEntry, sitemapFromQuery } from "@/lib/seo/sitemap";
import { VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";
import { withSitemapCache } from "@/app/sitemaps/cache-headers";

export const dynamic = "force-dynamic";

const SITEMAP_URL_CAP = 50_000;

const STATIC: SitemapEntry[] = [{ path: "/colleges", changefreq: "daily", priority: 0.9 }];

export async function GET() {
  return withSitemapCache(
    await sitemapFromQuery(
      "colleges",
      STATIC,
      async () => {
        // Only pages that pass the same rule as the page's own robots tag
        // (isCollegeIndexable). A plain select, because the subqueries refer to
        // the institutions table by name.
        const list = await getDb()
          .select({
            id: institutions.id,
            slug: institutions.slug,
            createdAt: institutions.createdAt,
            updatedAt: institutions.updatedAt,
          })
          .from(institutions)
          .where(
            and(
              // The reserved Viewer Hub is internal plumbing for personal-email
              // accounts, not a real campus: it must never be handed to Google.
              ne(institutions.slug, VIEWER_INSTITUTION_SLUG),
              sql`(
                ${institutions.nirfRank} is not null
                or char_length(trim(coalesce(${institutions.description}, ''))) >= ${COLLEGE_INDEX_RULE.minDescription}
                or (select count(*) from ${userProfiles} where ${userProfiles.institutionId} = ${institutions.id} and ${userProfiles.isSeeded} = false) >= ${COLLEGE_INDEX_RULE.minStudents}
                or (select count(*) from ${posts} where ${posts.institutionId} = ${institutions.id} and ${posts.status} = 'PUBLISHED' and ${posts.isSeeded} = false) >= ${COLLEGE_INDEX_RULE.minPosts}
                or (select count(*) from ${academicResources} where ${academicResources.institutionId} = ${institutions.id}) >= ${COLLEGE_INDEX_RULE.minNotes}
              )`
            )
          )
          .orderBy(desc(institutions.createdAt))
          .limit(SITEMAP_URL_CAP - STATIC.length);
        return list.map((item) => ({
          path: `/college/${item.slug || item.id}`,
          lastmod: item.updatedAt ?? item.createdAt,
          changefreq: "weekly",
          priority: 0.7,
        }));
      },
      43200
    )
  );
}
