import { PUBLIC_PROFILE_COLUMNS } from "@/lib/profile-columns";
import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from "@/db";
import { articles, userProfiles } from "@/db/schema";
import { getCategoryMeta } from "@/constants/articles";
import { hexclaveServerApp } from "@/hexclave/server";
import { categoryCounts, indexableArticleWhere } from "@/lib/articles/hub-queries";
import { categoryPagePath } from "@/lib/articles/seo";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { getViewerInstitutionId, VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";
import { ArticlesHubClient } from "./articles-hub-client";

export const metadata: Metadata = buildMetadata({
  title: "Student articles",
  description:
    "Read and write placement stories, interview experiences, study guides and campus stories from Indian colleges.",
  path: "/articles",
  image: { url: "/og-articles.png", width: 1200, height: 630, alt: "CampusLoop Articles" },
  keywords: [
    "student articles",
    "placement experiences",
    "interview experiences",
    "engineering guides",
    "college stories",
  ],
});

export default async function ArticlesPage() {
  const db = getDb();
  const user = await hexclaveServerApp.getUser();

  let currentProfile = null;
  if (user) {
    currentProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      with: { institution: true },
    });
  }

  let initialArticles: any[] = [];
  const topics = await categoryCounts(indexableArticleWhere()).catch(() => []);

  try {
    const viewerId = await getViewerInstitutionId().catch(() => VIEWER_INSTITUTION_SLUG);
    const verifiedTierSql = sql`CASE 
      WHEN ${articles.institutionId} IS NOT NULL 
       AND ${articles.institutionId} != ${viewerId} 
       AND ${articles.institutionId} != ${VIEWER_INSTITUTION_SLUG} 
      THEN 1 
      ELSE 0 
    END`;

    initialArticles = await db.query.articles.findMany({
      where: eq(articles.status, "PUBLISHED"),
      orderBy: [sql`${verifiedTierSql} DESC`, desc(articles.publishedAt)],
      limit: 12,
      columns: { content: false },
      with: {
        author: {
          columns: PUBLIC_PROFILE_COLUMNS,
          with: { institution: true },
        },
        institution: true,
      },
    });
  } catch (err) {
    console.error("Failed to load initial server articles:", err);
  }

  const listJsonLd = {
    "@type": "CollectionPage",
    name: "CampusLoop student articles",
    url: absoluteUrl("/articles"),
    description:
      "Articles written by college students: placements, interviews, study guides and campus life.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: initialArticles.map((art, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: absoluteUrl(`/articles/${art.slug}`),
        name: art.title,
      })),
    },
  };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Articles", path: "/articles" }]), listJsonLd]} />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Skeleton className="mb-6 h-10 max-w-md rounded-full" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <Skeleton className="h-44 rounded-lg" />
                <Skeleton className="h-44 rounded-lg" />
              </div>
              <Skeleton className="h-96 rounded-lg lg:col-span-4" />
            </div>
          </div>
        }
      >
        <ArticlesHubClient initialArticles={initialArticles} initialProfile={currentProfile} />
      </Suspense>
      {topics.length > 0 && (
        <nav aria-labelledby="browse-topics" className="mx-auto max-w-7xl space-y-3 px-4 pb-32 pt-4 sm:px-6">
          <h2 id="browse-topics" className="text-xl text-fg">
            Browse articles by topic
          </h2>
          <ul className="flex flex-wrap gap-2">
            {topics.map((t) => {
              const meta = getCategoryMeta(t.category);
              return (
                <li key={t.category}>
                  <Link
                    href={categoryPagePath(meta.slug)}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-muted px-4 text-sm font-medium text-fg-muted transition-ui hover:bg-surface-sunken hover:text-fg"
                  >
                    {meta.label}
                    <span className="text-xs tabular-nums">{t.n}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
