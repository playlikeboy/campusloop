"use client";

import { ArrowLeft, Edit3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleCommentsSection } from "@/components/articles/article-comments-section";
import { ArticleListenButton } from "@/components/articles/article-listen-button";
import {
  ArticleAuthorCard,
  ArticleByline,
  ArticleEngagementBar,
} from "@/components/articles/article-reader-parts";
import { ArticleToc } from "@/components/articles/article-toc";
import { ReadingProgress } from "@/components/articles/reading-progress";
import { useArticleEngagement } from "@/components/articles/use-article-engagement";
import { MarkdownContent } from "@/components/common/markdown-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategoryMeta } from "@/constants/articles";

interface ArticleReaderClientProps {
  article: {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    content: string;
    excerpt?: string | null;
    coverImageUrl?: string | null;
    category?: string | null;
    tags?: string[] | null;
    readingTimeMinutes?: number | null;
    viewsCount?: number | null;
    upvotesCount?: number | null;
    downvotesCount?: number | null;
    publishedAt?: Date | string | null;
    createdAt: Date | string;
    authorId: string;
    status?: string | null;
    author?: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      bio?: string | null;
      branch?: string | null;
      course?: string | null;
      points?: number | null;
      institution?: {
        name: string;
        slug: string;
      } | null;
    } | null;
    institution?: {
      name: string;
      slug: string;
    } | null;
  };
  currentProfile?: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
  } | null;
  initialUserVote?: number;
  initialIsSaved?: boolean;
  initialIsFollowingAuthor?: boolean;
  relatedArticles?: any[];
}

export function ArticleReaderClient({
  article,
  currentProfile,
  initialUserVote = 0,
  initialIsSaved = false,
  initialIsFollowingAuthor = false,
  relatedArticles = [],
}: ArticleReaderClientProps) {
  const hasSentViewRef = useRef(false);
  const handle = (article.author?.username || "").replace(/^@/, "");
  const engagement = useArticleEngagement({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    authorId: article.authorId,
    authorUsername: article.author?.username,
    viewerId: currentProfile?.id,
    initialUpvotes: article.upvotesCount || 0,
    initialUserVote,
    initialIsSaved,
    initialIsFollowing: initialIsFollowingAuthor,
  });

  const isOwner = currentProfile?.id === article.authorId || currentProfile?.role === "ADMIN";
  const catMeta = getCategoryMeta(article.category);
  const isViewerHub =
    article.institution?.slug === "viewer-hub" ||
    article.author?.institution?.slug === "viewer-hub" ||
    Boolean(article.institution?.name?.toLowerCase().includes("viewer hub")) ||
    Boolean(article.author?.institution?.name?.toLowerCase().includes("viewer hub"));
  const college = isViewerHub
    ? null
    : article.institution?.name?.split(",")[0] || article.author?.institution?.name?.split(",")[0] || null;
  const author = {
    name: article.author?.displayName || "Student writer",
    handle,
    avatarUrl: article.author?.avatarUrl,
    bio: article.author?.bio,
    college,
  };

  const date = new Date(article.publishedAt || article.createdAt);
  const dateLabel = date.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" });

  // Count a view after 3 seconds on the page, once per mount.
  useEffect(() => {
    if (hasSentViewRef.current) return;
    const timer = setTimeout(() => {
      hasSentViewRef.current = true;
      fetch(`/api/articles/${article.slug}/view`, { method: "POST" }).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [article.slug]);

  return (
    <div className="relative min-h-screen bg-bg pb-32">
      <ReadingProgress />

      <article className="mx-auto max-w-3xl space-y-8 px-4 pt-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild className="-ml-3">
            <Link href="/articles">
              <ArrowLeft className="size-4" />
              Articles
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">{catMeta.label}</Badge>
            {article.status && article.status !== "PUBLISHED" && (
              <Badge variant="warning">{article.status === "DRAFT" ? "Draft" : "Archived"}</Badge>
            )}
            {isOwner && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/articles/${article.slug}/edit`}>
                  <Edit3 className="size-4" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </div>

        <header className="space-y-4">
          <h1 className="text-4xl leading-[1.05] text-fg text-balance sm:text-5xl">{article.title}</h1>
          {article.subtitle && (
            <p className="text-lg text-fg-muted text-pretty sm:text-xl">{article.subtitle}</p>
          )}
          <ArticleByline
            author={author}
            readingMinutes={article.readingTimeMinutes || 3}
            dateLabel={dateLabel}
            dateIso={date.toISOString()}
            canFollow={Boolean(handle) && currentProfile?.id !== article.authorId}
            engagement={engagement}
          />
        </header>

        {article.coverImageUrl && (
          <figure className="overflow-hidden rounded-lg bg-surface-muted">
            <img src={article.coverImageUrl} alt="" className="max-h-[480px] w-full object-cover" />
          </figure>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <ArticleListenButton title={article.title} content={article.content} />
          </div>
          <ArticleToc content={article.content} />
        </div>

        <div className="max-w-[70ch] text-lg leading-[1.75] text-fg">
          <MarkdownContent content={article.content} autoEmbed />
        </div>

        {article.tags && article.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Tags">
            {article.tags.map((tag) => {
              const clean = tag.replace(/^#/, "");
              return (
                <li key={tag}>
                  <Link
                    href={`/articles?tag=${encodeURIComponent(clean)}`}
                    className="inline-flex h-9 items-center rounded-full bg-surface-muted px-3.5 text-sm font-medium text-fg-muted transition-ui hover:bg-surface-sunken hover:text-fg"
                  >
                    #{clean}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <ArticleEngagementBar engagement={engagement} />
        <ArticleAuthorCard author={author} />
        <ArticleCommentsSection articleSlug={article.slug} currentProfile={currentProfile} />

        {relatedArticles.length > 0 && (
          <section aria-labelledby="related-reads" className="space-y-2 border-t border-border pt-10">
            <h2 id="related-reads" className="text-2xl text-fg">
              Read next
            </h2>
            <div className="divide-y divide-border">
              {relatedArticles.map((rel) => (
                <ArticleCard key={rel.id} article={rel} />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
