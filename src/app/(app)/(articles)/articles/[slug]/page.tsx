import { and, desc, eq, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { articles, articleVotes, savedArticles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { getFollowState } from "@/lib/follows";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata, ogImageUrl, privateMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { getViewerInstitutionId, VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";
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
    return privateMetadata("Article not found");
  }

  const authorName = article.author?.displayName || `@${article.author?.username}`;
  const description =
    article.excerpt || article.subtitle || `${article.title}, an article by ${authorName} on CampusLoop.`;

  return buildMetadata({
    title: article.title,
    description,
    path: `/articles/${article.slug}`,
    image: article.coverImageUrl
      ? { url: article.coverImageUrl, alt: article.title }
      : ogImageUrl(article.title, "Article"),
    type: "article",
    publishedTime: article.publishedAt?.toISOString(),
    modifiedTime: article.updatedAt?.toISOString(),
    authors: [authorName],
    keywords: [...(article.tags || []), article.category].filter(Boolean),
  });
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
  const viewerId = await getViewerInstitutionId().catch(() => VIEWER_INSTITUTION_SLUG);
  const verifiedTierSql = sql`CASE 
    WHEN ${articles.institutionId} IS NOT NULL 
     AND ${articles.institutionId} != ${viewerId} 
     AND ${articles.institutionId} != ${VIEWER_INSTITUTION_SLUG} 
    THEN 1 
    ELSE 0 
  END`;

  const moreArticles = await db.query.articles.findMany({
    where: and(
      eq(articles.status, "PUBLISHED"),
      or(eq(articles.category, article.category), eq(articles.institutionId, article.institutionId || ""))
    ),
    limit: 6,
    orderBy: [sql`${verifiedTierSql} DESC`, desc(articles.publishedAt)],
    with: {
      author: {
        with: { institution: true },
      },
      institution: true,
    },
  });

  const filteredMore = moreArticles.filter((a) => a.id !== article.id).slice(0, 3);

  const authorName = article.author?.displayName || `@${article.author?.username}`;
  const articlePath = `/articles/${article.slug}`;
  const structuredData = [
    breadcrumbJsonLd([
      { name: "Articles", path: "/articles" },
      { name: article.title, path: articlePath },
    ]),
    articleJsonLd({
      headline: article.title,
      description: article.excerpt || article.subtitle,
      path: articlePath,
      image: article.coverImageUrl,
      datePublished: article.publishedAt ?? article.createdAt,
      dateModified: article.updatedAt ?? article.createdAt,
      authorName,
      authorPath: article.author?.username ? `/@${article.author.username}` : null,
    }),
  ];

  return (
    <>
      {article.status === "PUBLISHED" && <JsonLd data={structuredData} />}
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
