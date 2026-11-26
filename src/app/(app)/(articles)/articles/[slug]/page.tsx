import { PUBLIC_PROFILE_COLUMNS } from "@/lib/profile-columns";
import { and, asc, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getDb } from "@/db";
import { articleLinks, articles, articleVotes, courses, savedArticles, userProfiles } from "@/db/schema";
import { getCategoryMeta } from "@/constants/articles";
import { hexclaveServerApp } from "@/hexclave/server";
import { articleByline } from "@/lib/articles/byline";
import {
  articleRedirectTarget,
  articleRobots,
  articleWordCount,
  categoryPagePath,
  clampDescription,
} from "@/lib/articles/seo";
import { getFollowState } from "@/lib/follows";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata, ogImageUrl, privateMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { getViewerInstitutionId, VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";
import { ArticleReaderClient, type InBodyLink } from "./article-reader-client";

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
        columns: PUBLIC_PROFILE_COLUMNS,
        with: { institution: true },
      },
      institution: true,
    },
  });

  if (!article || article.status !== "PUBLISHED") {
    return privateMetadata("Article not found");
  }

  const byline = articleByline(article);
  const description = clampDescription(
    article.excerpt || article.subtitle || `${article.title}, an article by ${byline.name} on CampusLoop.`
  );

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
    authors: [byline.name],
    keywords: [...(article.tags || []), getCategoryMeta(article.category).label].filter(Boolean),
    robots: articleRobots(article.seoStatus),
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
        columns: PUBLIC_PROFILE_COLUMNS,
        with: { institution: true },
      },
      institution: true,
      links: { orderBy: [asc(articleLinks.displayOrder)] },
    },
  });

  if (!article) {
    notFound();
  }

  // Merged near-duplicates answer a permanent redirect to the article they were folded into.
  const redirectTarget = article.status === "PUBLISHED" ? articleRedirectTarget(article) : null;
  if (redirectTarget) {
    permanentRedirect(`/articles/${encodeURIComponent(redirectTarget)}`);
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
      ne(articles.id, article.id),
      eq(articles.seoStatus, "index"),
      isNull(articles.redirectToSlug),
      or(eq(articles.category, article.category), eq(articles.institutionId, article.institutionId || ""))
    ),
    limit: 8,
    columns: { content: false },
    orderBy: [sql`${verifiedTierSql} DESC`, desc(articles.publishedAt)],
    with: {
      author: {
        columns: PUBLIC_PROFILE_COLUMNS,
        with: { institution: true },
      },
      institution: true,
    },
  });

  // "Read next" at the end keeps the first three; the in-body box uses the next ones,
  // preferring the same category, so the page links to six different articles.
  const filteredMore = moreArticles.slice(0, 3);
  const inBodyPool = moreArticles.slice(3);
  const sameCategory = inBodyPool.filter((a) => a.category === article.category);
  const inBodyArticles = [...sameCategory, ...inBodyPool.filter((a) => a.category !== article.category)];

  const catMeta = getCategoryMeta(article.category);
  const inBodyLinks: InBodyLink[] = inBodyArticles.slice(0, 2).map((a) => ({
    href: `/articles/${a.slug}`,
    label: a.title,
    kind: "Article",
  }));

  // A matching free course when a tag lines up. One small indexed query; skipped on error.
  const cleanTags = (article.tags || []).map((t) => t.replace(/^#/, "").toLowerCase()).filter(Boolean).slice(0, 8);
  if (cleanTags.length > 0) {
    try {
      const course = await db.query.courses.findFirst({
        columns: { slug: true, title: true },
        where: and(
          eq(courses.status, "PUBLISHED"),
          eq(courses.listed, true),
          sql`${courses.tags} ?| array[${sql.join(
            cleanTags.map((t) => sql`${t}`),
            sql`, `
          )}]::text[]`
        ),
      });
      if (course) inBodyLinks.push({ href: `/courses/${course.slug}`, label: course.title, kind: "Free course" });
    } catch {
      // Course link is optional.
    }
  }
  const institution = article.institution;
  if (institution?.slug && institution.slug !== VIEWER_INSTITUTION_SLUG && inBodyLinks.length < 3) {
    inBodyLinks.push({ href: `/college/${institution.slug}`, label: institution.name, kind: "College" });
  }
  for (const a of inBodyArticles.slice(2)) {
    if (inBodyLinks.length >= 3) break;
    inBodyLinks.push({ href: `/articles/${a.slug}`, label: a.title, kind: "Article" });
  }
  if (inBodyLinks.length < 3) {
    inBodyLinks.push({ href: categoryPagePath(catMeta.slug), label: `More in ${catMeta.label}`, kind: "Topic" });
  }

  const byline = articleByline(article);
  const articlePath = `/articles/${article.slug}`;
  const structuredData = [
    breadcrumbJsonLd([
      { name: "Articles", path: "/articles" },
      { name: catMeta.label, path: categoryPagePath(catMeta.slug) },
      { name: article.title, path: articlePath },
    ]),
    articleJsonLd({
      headline: article.title,
      description: article.excerpt || article.subtitle,
      path: articlePath,
      image: article.coverImageUrl || ogImageUrl(article.title, "Article"),
      datePublished: article.publishedAt ?? article.createdAt,
      dateModified: article.updatedAt ?? article.createdAt,
      authorName: byline.name,
      authorPath: byline.path,
      authorType: byline.kind === "organization" ? "Organization" : "Person",
      articleSection: catMeta.label,
      wordCount: articleWordCount(article.content),
      keywords: article.tags,
      isAccessibleForFree: true,
    }),
  ];

  const sources = (article.links || [])
    .filter((l) => /^https?:\/\//i.test(l.url))
    .map((l) => ({ url: l.url, label: l.label, description: l.description }));

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
        byline={byline}
        inBodyLinks={inBodyLinks.slice(0, 3)}
        sources={sources}
        categoryHref={categoryPagePath(catMeta.slug)}
      />
    </>
  );
}
