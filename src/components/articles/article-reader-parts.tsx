"use client";

import { ArrowUp, Bookmark, Check, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ArticleEngagement } from "./use-article-engagement";

interface ArticleAuthor {
  name: string;
  handle: string;
  avatarUrl?: string | null;
  bio?: string | null;
  college?: string | null;
}

/** Byline under the headline: author, follow, college, read time, date, and quick save/share. */
export function ArticleByline({
  author,
  readingMinutes,
  dateLabel,
  dateIso,
  canFollow,
  engagement,
}: {
  author: ArticleAuthor;
  readingMinutes: number;
  dateLabel: string;
  dateIso: string;
  canFollow: boolean;
  engagement: ArticleEngagement;
}) {
  const profileHref = `/@${author.handle}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link href={profileHref} aria-label={`${author.name}'s profile`}>
          <Avatar className="size-11">
            <AvatarImage src={author.avatarUrl || ""} alt="" />
            <AvatarFallback className="bg-surface-muted text-sm font-semibold text-fg">
              {author.name[0]}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link href={profileHref} className="truncate text-sm font-semibold text-fg hover:underline">
              {author.name}
            </Link>
            {canFollow && (
              <Button
                variant={engagement.isFollowing ? "secondary" : "outline"}
                size="xs"
                onClick={engagement.toggleFollow}
                aria-pressed={engagement.isFollowing}
              >
                {engagement.isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-fg-muted">
            {author.college && <span>{author.college}</span>}
            {author.college && <span aria-hidden>·</span>}
            <span>{readingMinutes} min read</span>
            <span aria-hidden>·</span>
            <time dateTime={dateIso}>{dateLabel}</time>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <SaveButton engagement={engagement} iconOnly />
        <ShareButton engagement={engagement} iconOnly />
      </div>
    </div>
  );
}

function SaveButton({ engagement, iconOnly }: { engagement: ArticleEngagement; iconOnly?: boolean }) {
  return (
    <Button
      variant="ghost"
      size={iconOnly ? "icon" : "sm"}
      onClick={engagement.toggleSave}
      aria-pressed={engagement.isSaved}
      aria-label={iconOnly ? (engagement.isSaved ? "Remove from saved" : "Save for later") : undefined}
      selected={engagement.isSaved}
    >
      <Bookmark className={cn("size-4", engagement.isSaved && "fill-current")} />
      {!iconOnly && (engagement.isSaved ? "Saved" : "Save")}
    </Button>
  );
}

function ShareButton({ engagement, iconOnly }: { engagement: ArticleEngagement; iconOnly?: boolean }) {
  return (
    <Button
      variant="ghost"
      size={iconOnly ? "icon" : "sm"}
      onClick={engagement.share}
      aria-label={iconOnly ? "Share" : undefined}
    >
      {engagement.copied ? <Check className="size-4 text-verified-text" /> : <Share2 className="size-4" />}
      {!iconOnly && (engagement.copied ? "Copied" : "Share")}
    </Button>
  );
}

/** Upvote / comments / save / share row after the article body. */
export function ArticleEngagementBar({ engagement }: { engagement: ArticleEngagement }) {
  const voted = engagement.userVote === 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border py-3">
      <div className="flex items-center gap-2">
        <Button
          variant={voted ? "primary" : "secondary"}
          size="sm"
          onClick={engagement.toggleVote}
          aria-pressed={voted}
          className="tabular-nums"
        >
          <ArrowUp className="size-4" />
          {engagement.upvotes} {engagement.upvotes === 1 ? "upvote" : "upvotes"}
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <a href="#comments">
            <MessageSquare className="size-4" />
            Comments
          </a>
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <SaveButton engagement={engagement} />
        <ShareButton engagement={engagement} />
      </div>
    </div>
  );
}

/** "Written by" block at the end of the article. */
export function ArticleAuthorCard({ author }: { author: ArticleAuthor }) {
  const profileHref = `/@${author.handle}`;
  return (
    <section
      aria-label="About the writer"
      className="flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="size-14 shrink-0">
          <AvatarImage src={author.avatarUrl || ""} alt="" />
          <AvatarFallback className="bg-surface-muted text-base font-semibold text-fg">
            {author.name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-base font-semibold text-fg">{author.name}</p>
          <p className="truncate text-sm text-fg-muted">
            @{author.handle}
            {author.college ? ` · ${author.college}` : ""}
          </p>
          {author.bio && <p className="line-clamp-2 pt-1 text-sm text-fg-muted">{author.bio}</p>}
        </div>
      </div>
      <Button variant="outline" size="sm" asChild className="shrink-0">
        <Link href={profileHref}>See profile</Link>
      </Button>
    </section>
  );
}
