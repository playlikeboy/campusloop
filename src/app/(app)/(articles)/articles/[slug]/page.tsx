import { and, desc, eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES_CANONICAL_HOST } from "@/constants/articles";
import { getDb } from "@/db";
import { articles, articleVotes, savedArticles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { getFollowState } from "@/lib/follows";
import { ArticleReaderClient } from "./article-reader-client";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const article = await db.query.articles.findFirst({
    where: or(eq(articles.slug, slug), eq(articles.id, slug)),
    with: {
      author: {
        with: { institution: true },
      },
      institution: true,
    },
  });

  if (!article || article.status !== "PUBLISHED") {
    return { title: "Article Not Found" };
  }

  const title = `${article.title} — By ${article.author?.displayName || `@${article.author?.username}`} | CampusLoop`;
  const description = article.excerpt || article.subtitle || `Read ${article.title} on CampusLoop.`;
  const canonicalUrl = `${ARTICLES_CANONICAL_HOST}/articles/${article.slug}`;
  const ogImage = article.coverImageUrl || `${ARTICLES_CANONICAL_HOST}/og-image.png`;

  return {
    title,
    description,
    keywords: [
      ...(article.tags || []),
      "CampusLoop Article",
      "College Long Read",
      article.category,
      article.institution?.name || "Campus",
      `@${article.author?.username}`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "CampusLoop Articles",
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.author?.displayName || `@${article.author?.username}`],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const db = getDb();
  const user = await hexclaveServerApp.getUser();

  let currentProfile = null;
  if (user) {
    currentProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      with: { institution: true },
    });
  }

  const article = await db.query.articles.findFirst({
    where: or(eq(articles.slug, slug), eq(articles.id, slug)),
    with: {
      author: {
        with: { institution: true },
      },
      institution: true,
    },
  });

  if (!article) {
    notFound();
  }

  // Security: unpublished/draft/archived articles are only viewable by author or admin
  const isAuthor = currentProfile?.id === article.authorId;
  const isAdmin = currentProfile?.role === "ADMIN";
  if (article.status !== "PUBLISHED" && !isAuthor && !isAdmin) {
    notFound();
  }

  // Get viewer's vote and saved state
  let userVote = 0;
  let isSaved = false;

  if (currentProfile) {
    const [vote, saved] = await Promise.all([
      db.query.articleVotes.findFirst({
        where: and(eq(articleVotes.articleId, article.id), eq(articleVotes.profileId, currentProfile.id)),
      }),
      db.query.savedArticles.findFirst({
        where: and(eq(savedArticles.articleId, article.id), eq(savedArticles.profileId, currentProfile.id)),
      }),
    ]);

    if (vote) userVote = vote.value;
    if (saved) isSaved = true;
  }

  // Get follow state of author
  let isFollowingAuthor = false;
  if (currentProfile && currentProfile.id !== article.authorId) {
    try {
      const followState = await getFollowState(article.authorId, currentProfile.id);
      isFollowingAuthor = followState.isFollowedByViewer;
    } catch {
      // fallback
    }
  }

  // Fetch related articles (same category or campus, excluding this article)
  const moreArticles = await db.query.articles.findMany({
    where: and(
      eq(articles.status, "PUBLISHED"),
      or(eq(articles.category, article.category), eq(articles.institutionId, article.institutionId || ""))
    ),
    limit: 6,
    orderBy: [desc(articles.publishedAt)],
    with: {
      author: {
        with: { institution: true },
      },
      institution: true,
    },
  });

  const filteredMore = moreArticles.filter((a) => a.id !== article.id).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || article.subtitle,
    image: article.coverImageUrl || `${ARTICLES_CANONICAL_HOST}/og-image.png`,
    datePublished: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
    dateModified: article.updatedAt?.toISOString() || article.createdAt.toISOString(),
    author: {
      "@type": "Person",
      name: article.author?.displayName || `@${article.author?.username}`,
      url: `${ARTICLES_CANONICAL_HOST}/${article.author?.username}`,
    },
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      url: ARTICLES_CANONICAL_HOST,
      logo: `${ARTICLES_CANONICAL_HOST}/logo.png`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${ARTICLES_CANONICAL_HOST}/articles/${article.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleReaderClient
        article={article as any}
        currentProfile={currentProfile as any}
        initialUserVote={userVote}
        initialIsSaved={isSaved}
        initialIsFollowingAuthor={isFollowingAuthor}
        relatedArticles={filteredMore as any}
      />
    </>
  );
}
