"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCategoryMeta } from "@/constants/articles";
import { ArticleCardActions } from "./article-card-actions";

export interface ArticleCardProps {
  article: {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    excerpt?: string | null;
    coverImageUrl?: string | null;
    category?: string | null;
    tags?: string[] | null;
    readingTimeMinutes?: number | null;
    viewsCount?: number | null;
    upvotesCount?: number | null;
    userVote?: number;
    isSaved?: boolean;
    commentsCount?: number;
    publishedAt?: Date | string | null;
    createdAt?: Date | string;
    author?: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      points?: number | null;
      branch?: string | null;
      institution?: {
        name: string;
        shortName?: string | null;
      } | null;
    } | null;
    institution?: {
      name: string;
    } | null;
  };
  featured?: boolean;
}

function formatDate(value?: Date | string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const catMeta = getCategoryMeta(article.category);
  const authorName = article.author?.displayName || "Student writer";
  const handle = (article.author?.username || "").replace(/^@/, "");
  const collegeName =
    article.institution?.name?.split(",")[0] || article.author?.institution?.name?.split(",")[0] || "";
  const isViewerHub = collegeName.toLowerCase().includes("viewer hub");
  const college = isViewerHub ? "" : collegeName;
  const date = formatDate(article.publishedAt);
  const href = `/articles/${article.slug}`;

  const byline = (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <Link href={handle ? `/@${handle}` : href} className="group/author flex min-w-0 items-center gap-2">
        <Avatar className="size-6 shrink-0">
          <AvatarImage src={article.author?.avatarUrl || ""} alt="" />
          <AvatarFallback className="bg-surface-muted text-xs font-semibold text-fg">
            {authorName[0]}
          </AvatarFallback>
        </Avatar>
        <span className="truncate font-semibold text-fg group-hover/author:underline">{authorName}</span>
      </Link>
      {college && (
        <>
          <span aria-hidden className="text-fg-subtle">
            ·
          </span>
          <span className="truncate text-fg-muted">{college}</span>
        </>
      )}
    </div>
  );

  const meta = (
    <div className="flex items-center gap-2 text-xs text-fg-muted">
      <Badge variant="neutral">{catMeta.label}</Badge>
      <span className="flex items-center gap-1">
        <Clock aria-hidden className="size-3.5" />
        {article.readingTimeMinutes || 3} min read
      </span>
      {date && <time dateTime={new Date(article.publishedAt as string).toISOString()}>{date}</time>}
    </div>
  );

  const actions = (
    <ArticleCardActions
      slug={article.slug}
      title={article.title}
      excerpt={article.excerpt}
      upvotesCount={article.upvotesCount}
      userVote={article.userVote}
      isSaved={article.isSaved}
      commentsCount={article.commentsCount}
    />
  );

  if (featured) {
    return (
      <article className="group overflow-hidden rounded-lg border border-border bg-surface transition-ui hover:border-border-strong">
        <div className="flex flex-col gap-5 p-4 sm:p-6 md:flex-row">
          {article.coverImageUrl && (
            <Link
              href={href}
              tabIndex={-1}
              aria-hidden
              className="block aspect-16/10 shrink-0 overflow-hidden rounded-md bg-surface-muted md:w-2/5"
            >
              <img src={article.coverImageUrl} alt="" loading="lazy" className="size-full object-cover" />
            </Link>
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
            <div className="space-y-3">
              {byline}
              <h2 className="text-2xl leading-tight text-fg text-balance">
                <Link href={href} className="hover:text-brand-text">
                  {article.title}
                </Link>
              </h2>
              {article.excerpt && <p className="line-clamp-3 text-sm text-fg-muted">{article.excerpt}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              {meta}
              {actions}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          {byline}
          <h3 className="line-clamp-2 text-lg leading-snug text-fg">
            <Link href={href} className="hover:text-brand-text">
              {article.title}
            </Link>
          </h3>
          {article.excerpt && <p className="line-clamp-2 text-sm text-fg-muted">{article.excerpt}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {meta}
            {actions}
          </div>
        </div>
        {article.coverImageUrl && (
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden
            className="hidden size-24 shrink-0 overflow-hidden rounded-md bg-surface-muted sm:block sm:size-28"
          >
            <img src={article.coverImageUrl} alt="" loading="lazy" className="size-full object-cover" />
          </Link>
        )}
      </div>
    </article>
  );
}
