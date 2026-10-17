"use client";

import {
  ArrowLeft,
  ArrowUp,
  Bookmark,
  Check,
  Edit3,
  MessageSquare,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleCommentsSection } from "@/components/articles/article-comments-section";
import { ArticleListenButton } from "@/components/articles/article-listen-button";
import { ArticleToc } from "@/components/articles/article-toc";
import { ReadingProgress } from "@/components/articles/reading-progress";
import { MarkdownContent } from "@/components/common/markdown-content";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ARTICLES_CANONICAL_HOST, getCategoryMeta } from "@/constants/articles";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

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
  const [userVote, setUserVote] = useState(initialUserVote);
  const [upvotes, setUpvotes] = useState(article.upvotesCount || 0);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowingAuthor);
  const [copied, setCopied] = useState(false);

  const hasSentViewRef = useRef(false);

  const isOwner = currentProfile?.id === article.authorId || currentProfile?.role === "ADMIN";
  const catMeta = getCategoryMeta(article.category);
  const authorName = article.author?.displayName || "Student Writer";
  const authorUsername = article.author?.username || "student";
  const isVerified = (article.author?.points || 0) >= 150;
  const collegeName =
    article.institution?.name?.split(",")[0] || article.author?.institution?.name?.split(",")[0] || "Campus";

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : new Date(article.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  // Track meaningful view after 3 seconds of reading (once per session)
  useEffect(() => {
    if (hasSentViewRef.current) return;
    const timer = setTimeout(() => {
      hasSentViewRef.current = true;
      fetch(`/api/articles/${article.slug}/view`, { method: "POST" }).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [article.slug]);

  async function handleVote() {
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
      toast.error("Please sign in to upvote");
    }
  }

  async function handleToggleSave() {
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
      toast.success(data.message || (data.isSaved ? "Saved to reading list" : "Removed from reading list"));
    } catch {
      setIsSaved(prevSaved);
      toast.error("Please sign in to save articles");
    }
  }

  async function handleToggleFollow() {
    if (!currentProfile) {
      toast.info("Please sign in to follow authors");
      return;
    }
    if (currentProfile.id === article.authorId) return;

    sounds.tap();
    haptics.light();
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    try {
      const res = await fetch(`/api/users/${article.author?.username}/follow`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success(nextState ? `Followed @${article.author?.username}` : "Unfollowed");
    } catch {
      setIsFollowing(!nextState);
      toast.error("Failed to update follow status");
    }
  }

  function handleShare() {
    const canonicalUrl = `${ARTICLES_CANONICAL_HOST}/articles/${article.slug}`;

    if (navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.excerpt || article.title,
          url: canonicalUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      toast.success("Publication link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="relative min-h-screen bg-background pb-32">
      {/* ─── Top Reading Progress Bar (Isolated Client Island) ─── */}
      <ReadingProgress />

      <article className="mx-auto max-w-3xl px-4 sm:px-6 pt-8 space-y-8">
        {/* ─── Top Category & Back Navigation ─── */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <Link
            href="/articles"
            className="flex items-center gap-1.5 font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Articles</span>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border",
                catMeta.colorClass
              )}
            >
              {catMeta.label}
            </span>

            {isOwner && (
              <Link
                href={`/articles/${article.slug}/edit`}
                className="flex items-center gap-1 px-3 py-1 rounded-full border border-border/60 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                <Edit3 className="size-3" />
                <span>Edit</span>
              </Link>
            )}
          </div>
        </div>

        {/* ─── Headline & Subtitle (Medium / Hashnode Readability) ─── */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-[1.15]">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-normal">
              {article.subtitle}
            </p>
          )}

          {/* Author Byline Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-y border-border/30 py-4">
            <div className="flex items-center gap-3">
              <Link href={`/@${authorUsername.replace(/^@/, "")}`}>
                <Avatar className="size-11 border border-border/50 shadow-xs">
                  <AvatarImage src={article.author?.avatarUrl || ""} />
                  <AvatarFallback className="text-sm font-bold bg-muted text-foreground">
                    {authorName[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/@${authorUsername.replace(/^@/, "")}`}
                    className="text-sm font-bold text-foreground hover:underline"
                  >
                    {authorName}
                  </Link>
                  {isVerified && <ShieldCheck className="size-3.5 text-primary shrink-0" />}

                  {currentProfile?.id !== article.authorId && (
                    <button
                      type="button"
                      onClick={handleToggleFollow}
                      className={cn(
                        "text-xs font-semibold transition-colors cursor-pointer",
                        isFollowing
                          ? "text-muted-foreground hover:text-foreground"
                          : "text-primary hover:underline"
                      )}
                    >
                      {isFollowing ? "Following" : "· Follow"}
                    </button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <span>{collegeName}</span>
                  <span>·</span>
                  <span>{article.readingTimeMinutes || 3} min read</span>
                  <span>·</span>
                  <span>{formattedDate}</span>
                </p>
              </div>
            </div>

            {/* Quick Share / Bookmark Header Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleSave}
                aria-label={isSaved ? "Remove from saved" : "Save article"}
                className={cn(
                  "p-2 rounded-full border border-border/50 transition-colors cursor-pointer",
                  isSaved
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                title={isSaved ? "Saved" : "Save for later"}
              >
                <Bookmark className={cn("size-4", isSaved && "fill-primary")} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                aria-label="Share article"
                className="p-2 rounded-full border border-border/50 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Share article"
              >
                {copied ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Cover Image ─── */}
        {article.coverImageUrl && (
          <div className="overflow-hidden rounded-2xl border border-border/40 shadow-xs">
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full max-h-[480px] object-cover"
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ArticleListenButton title={article.title} content={article.content} />
          </div>
          <ArticleToc content={article.content} />
        </div>

        {/* ─── Long-Form Markdown Content Body (Zero select-none) ─── */}
        <div className="pt-2 text-foreground font-normal leading-[1.8] text-[17px] sm:text-[19px]">
          <MarkdownContent content={article.content} autoEmbed />
        </div>

        {/* ─── Tags Strip ─── */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-6 border-t border-border/30">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/articles?tag=${encodeURIComponent(tag.replace(/^#/, ""))}`}
                className="px-3 py-1 rounded-lg bg-muted/40 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground border border-border/40 transition-colors"
              >
                #{tag.replace(/^#/, "")}
              </Link>
            ))}
          </div>
        )}

        {/* ─── Engagement Actions Bar (Like / Comment / Save / Share) ─── */}
        <div className="flex items-center justify-between border-y border-border/30 py-3.5 my-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleVote}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                userVote === 1
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 hover:bg-muted text-foreground border border-border/40"
              )}
            >
              <ArrowUp className="size-4" />
              <span>{upvotes} Upvotes</span>
            </button>

            <a
              href="#comments"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-foreground border border-border/40 text-xs font-semibold transition-colors"
            >
              <MessageSquare className="size-3.5 text-muted-foreground" />
              <span>Discussion</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSave}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                isSaved
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/40 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Bookmark className={cn("size-3.5", isSaved && "fill-primary")} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-muted/40 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>
          </div>
        </div>

        {/* ─── Author Bio Box ─── */}
        <div className="rounded-2xl border border-border/40 bg-card/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href={`/@${authorUsername.replace(/^@/, "")}`}>
              <Avatar className="size-14 border border-border/50">
                <AvatarImage src={article.author?.avatarUrl || ""} />
                <AvatarFallback className="text-base font-bold bg-muted text-foreground">
                  {authorName[0]}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/@${authorUsername.replace(/^@/, "")}`}
                  className="font-bold text-foreground hover:underline text-base truncate"
                >
                  {authorName}
                </Link>
                {isVerified && <ShieldCheck className="size-4 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                @{authorUsername} · {collegeName}
              </p>
              {article.author?.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-0.5">
                  {article.author.bio}
                </p>
              )}
            </div>
          </div>

          <Link
            href={`/@${authorUsername.replace(/^@/, "")}`}
            className="px-4 py-2 rounded-full border border-border/50 bg-background hover:bg-muted text-xs font-bold text-foreground transition-colors shrink-0"
          >
            View Profile
          </Link>
        </div>

        {/* ─── Threaded Comments Discussion ─── */}
        <ArticleCommentsSection articleSlug={article.slug} currentProfile={currentProfile} />

        {/* ─── Related Reads ─── */}
        {relatedArticles.length > 0 && (
          <div className="pt-12 space-y-4 border-t border-border/40">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Related Student Reads</h3>
            </div>

            <div className="divide-y divide-border/25">
              {relatedArticles.map((rel) => (
                <ArticleCard key={rel.id} article={rel} />
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
