"use client";

import { ArrowUp, Bookmark, Check, Clock, MessageSquare, Share2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ARTICLES_CANONICAL_HOST, getCategoryMeta } from "@/constants/articles";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

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

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const [upvotes, setUpvotes] = useState(article.upvotesCount || 0);
  const [userVote, setUserVote] = useState(article.userVote || 0);
  const [isSaved, setIsSaved] = useState(Boolean(article.isSaved));
  const [copied, setCopied] = useState(false);

  const catMeta = getCategoryMeta(article.category);
  const authorName = article.author?.displayName || "Student Writer";
  const authorUsername = article.author?.username || "student";
  const isVerified = (article.author?.points || 0) >= 150;
  const collegeShort =
    article.institution?.name?.split(",")[0] || article.author?.institution?.name?.split(",")[0] || "Campus";

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })
    : "Recent";

  async function handleVote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    sounds.tap();
    haptics.medium();

    const prevVote = userVote;
    const nextVote = prevVote === 1 ? 0 : 1;
    setUserVote(nextVote);
    setUpvotes((prev) => prev + (nextVote === 1 ? 1 : -1));

    try {
      const res = await fetch(`/api/articles/${article.slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: nextVote }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { upvotesCount?: number };
      if (typeof data.upvotesCount === "number") {
        setUpvotes(data.upvotesCount);
      }
    } catch {
      setUserVote(prevVote);
      setUpvotes((prev) => prev + (prevVote === 1 ? 1 : -1));
      toast.error("Sign in to upvote articles");
    }
  }

  async function handleToggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    sounds.tap();
    haptics.light();

    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    try {
      const res = await fetch(`/api/articles/${article.slug}/save`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { isSaved?: boolean; message?: string };
      setIsSaved(Boolean(data.isSaved));
      toast.success(data.message || (data.isSaved ? "Saved to reading list" : "Removed"));
    } catch {
      setIsSaved(prevSaved);
      toast.error("Sign in to save articles");
    }
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${ARTICLES_CANONICAL_HOST}/articles/${article.slug}`;

    if (navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.excerpt || article.title,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 transition-all hover:border-primary/40 hover:bg-card hover:shadow-md">
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* Featured Cover */}
          {article.coverImageUrl && (
            <Link
              href={`/articles/${article.slug}`}
              className="relative block md:w-2/5 aspect-16/10 rounded-xl overflow-hidden bg-muted/30 shrink-0"
            >
              <img
                src={article.coverImageUrl}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-2.5 left-2.5">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md",
                    catMeta.colorClass
                  )}
                >
                  {catMeta.label}
                </span>
              </div>
            </Link>
          )}

          {/* Featured Content */}
          <div className="flex flex-1 flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              {/* Author Row */}
              <div className="flex items-center gap-2 text-xs">
                <Link href={`/${authorUsername}`} className="flex items-center gap-2 group/author">
                  <Avatar className="size-6 border border-border/40">
                    <AvatarImage src={article.author?.avatarUrl || ""} />
                    <AvatarFallback className="text-[10px] font-bold bg-muted text-foreground">
                      {authorName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-foreground group-hover/author:underline truncate">
                    {authorName}
                  </span>
                  {isVerified && <ShieldCheck className="size-3 text-primary shrink-0" />}
                </Link>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground truncate">{collegeShort}</span>
              </div>

              {/* Title & Excerpt */}
              <Link
                href={`/articles/${article.slug}`}
                className="block group-hover:text-primary transition-colors"
              >
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-2 leading-snug">
                  {article.title}
                </h2>
              </Link>

              {article.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/20">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="size-3.5" />
                  <span>{article.readingTimeMinutes || 3} min read</span>
                </span>
                <span>·</span>
                <span>{formattedDate}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleVote}
                  aria-label="Upvote article"
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                    userVote === 1
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ArrowUp className="size-3.5" />
                  <span>{upvotes}</span>
                </button>

                <Link
                  href={`/articles/${article.slug}#comments`}
                  aria-label="View discussion"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MessageSquare className="size-3.5" />
                  <span>{article.commentsCount ?? 0}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleToggleSave}
                  aria-label={isSaved ? "Remove from saved" : "Save article"}
                  className={cn(
                    "p-1.5 rounded-full transition-colors cursor-pointer",
                    isSaved
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Bookmark className={cn("size-3.5", isSaved && "fill-primary")} />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share article"
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group py-5 first:pt-2 border-b border-border/30 last:border-b-0 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Article Details */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Author Byline */}
          <div className="flex items-center gap-2 text-xs">
            <Link href={`/${authorUsername}`} className="flex items-center gap-1.5 group/author">
              <Avatar className="size-5.5 border border-border/40 shrink-0">
                <AvatarImage src={article.author?.avatarUrl || ""} />
                <AvatarFallback className="text-[9px] font-bold bg-muted text-foreground">
                  {authorName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground group-hover/author:underline truncate">
                {authorName}
              </span>
              {isVerified && <ShieldCheck className="size-3 text-primary shrink-0" />}
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground truncate">{collegeShort}</span>
          </div>

          {/* Title */}
          <Link
            href={`/articles/${article.slug}`}
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-2 leading-snug">
              {article.title}
            </h3>
          </Link>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {/* Card Footer: Metadata + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <span
                className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border", catMeta.colorClass)}
              >
                {catMeta.label}
              </span>
              <span>{article.readingTimeMinutes || 3} min read</span>
              <span>·</span>
              <span>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleVote}
                aria-label="Upvote article"
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                  userVote === 1
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowUp className="size-3.5" />
                <span>{upvotes}</span>
              </button>

              <Link
                href={`/articles/${article.slug}#comments`}
                aria-label="View comments"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <MessageSquare className="size-3.5" />
                <span>{article.commentsCount ?? 0}</span>
              </Link>

              <button
                type="button"
                onClick={handleToggleSave}
                aria-label={isSaved ? "Remove from saved" : "Save article"}
                className={cn(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  isSaved
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Bookmark className={cn("size-3.5", isSaved && "fill-primary")} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                aria-label="Share article"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Optional Thumbnail */}
        {article.coverImageUrl && (
          <Link
            href={`/articles/${article.slug}`}
            className="hidden sm:block size-24 sm:size-28 rounded-xl overflow-hidden bg-muted/30 shrink-0 border border-border/40"
          >
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        )}
      </div>
    </article>
  );
}
