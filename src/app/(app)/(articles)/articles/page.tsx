import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ARTICLES_CANONICAL_HOST } from "@/constants/articles";
import { getDb } from "@/db";
import { articles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { ArticlesHubClient } from "./articles-hub-client";

export const metadata: Metadata = {
  title: "Campus Articles & Student Long Reads",
  description:
    "Read, write, and explore in-depth student articles, placement roadmaps, engineering guides, research, and campus stories from 1,350+ Indian colleges.",
  keywords: [
    "CampusLoop Articles",
    "Student Blog",
    "College Placement Experiences",
    "Engineering Guides",
    "Campus Stories",
    "Indian College Tech Blogs",
  ],
  alternates: {
    canonical: `${ARTICLES_CANONICAL_HOST}/articles`,
  },
  openGraph: {
    title: "Campus Articles & Student Long Reads",
    description:
      "In-depth student articles, placement guides, and campus insights written by verified seniors.",
    url: `${ARTICLES_CANONICAL_HOST}/articles`,
    siteName: "CampusLoop",
    type: "website",
    images: [
      {
        url: `${ARTICLES_CANONICAL_HOST}/og-articles.png`,
        width: 1536,
        height: 1024,
        alt: "CampusLoop Articles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop Articles — Student Tech & Campus Journalism",
    description:
      "Deep-dives, interview experiences, and campus guides written by verified university students.",
    images: [`${ARTICLES_CANONICAL_HOST}/og-articles.png`],
  },
};

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

  try {
    initialArticles = await db.query.articles.findMany({
      where: eq(articles.status, "PUBLISHED"),
      orderBy: [desc(articles.publishedAt)],
      limit: 12,
      columns: { content: false },
      with: {
        author: {
          with: { institution: true },
        },
        institution: true,
      },
    });
  } catch (err) {
    console.error("Failed to load initial server articles:", err);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "CampusLoop Student Articles",
    url: `${ARTICLES_CANONICAL_HOST}/articles`,
    description: "Verified student articles, roadmaps, and campus journalism.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      url: ARTICLES_CANONICAL_HOST,
      logo: `${ARTICLES_CANONICAL_HOST}/logo.png`,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: initialArticles.map((art, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${ARTICLES_CANONICAL_HOST}/articles/${art.slug}`,
        name: art.title,
        description: art.excerpt || art.subtitle,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
            <div className="h-10 max-w-md bg-muted/40 rounded-xl animate-pulse mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-4">
                <div className="h-44 rounded-xl bg-muted/40 animate-pulse" />
                <div className="h-44 rounded-xl bg-muted/40 animate-pulse" />
              </div>
              <div className="lg:col-span-4 h-96 rounded-xl bg-muted/40 animate-pulse" />
            </div>
          </div>
        }
      >
        <ArticlesHubClient initialArticles={initialArticles} initialProfile={currentProfile} />
      </Suspense>
    </>
  );
}
