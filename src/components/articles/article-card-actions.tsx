"use client";

import { ArrowUp, Bookmark, Check, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ARTICLES_CANONICAL_HOST } from "@/constants/articles";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface ArticleCardActionsProps {
  slug: string;
  title: string;
  excerpt?: string | null;
  upvotesCount?: number | null;
  userVote?: number;
  isSaved?: boolean;
  commentsCount?: number;
}

const actionClass =
  "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold tabular-nums transition-ui";
const idleClass = "text-fg-muted hover:bg-surface-muted hover:text-fg";
const onClass = "bg-brand-subtle text-brand-text";

/** Upvote, comments, save and share buttons shared by article cards. */
export function ArticleCardActions({
  slug,
  title,
  excerpt,
  upvotesCount,
  userVote: initialVote,
  isSaved: initialSaved,
  commentsCount,
}: ArticleCardActionsProps) {
  const [upvotes, setUpvotes] = useState(upvotesCount || 0);
  const [userVote, setUserVote] = useState(initialVote || 0);
  const [isSaved, setIsSaved] = useState(Boolean(initialSaved));
  const [copied, setCopied] = useState(false);

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
      const res = await fetch(`/api/articles/${slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: nextVote }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { upvotesCount?: number };
      if (typeof data.upvotesCount === "number") setUpvotes(data.upvotesCount);
    } catch {
      setUserVote(prevVote);
      setUpvotes((prev) => prev + (prevVote === 1 ? 1 : -1));
      toast.error("Couldn't upvote. Sign in and try again.");
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
      const res = await fetch(`/api/articles/${slug}/save`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { isSaved?: boolean };
      setIsSaved(Boolean(data.isSaved));
      toast.success(data.isSaved ? "Saved" : "Removed from saved");
    } catch {
      setIsSaved(prevSaved);
      toast.error("Couldn't save. Sign in and try again.");
    }
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${ARTICLES_CANONICAL_HOST}/articles/${slug}`;

    if (navigator.share) {
      navigator.share({ title, text: excerpt || title, url: shareUrl }).catch(() => {});
      return;
    }
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        toast.success("Link copied");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Couldn't copy the link. Copy it from the address bar."));
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={handleVote}
        aria-label={userVote === 1 ? "Remove upvote" : "Upvote"}
        aria-pressed={userVote === 1}
        className={cn(actionClass, userVote === 1 ? onClass : idleClass)}
      >
        <ArrowUp className="size-4" />
        {upvotes}
      </button>
      <Link
        href={`/articles/${slug}#comments`}
        aria-label={`${commentsCount ?? 0} comments`}
        className={cn(actionClass, idleClass)}
      >
        <MessageSquare className="size-4" />
        {commentsCount ?? 0}
      </Link>
      <button
        type="button"
        onClick={handleToggleSave}
        aria-label={isSaved ? "Remove from saved" : "Save"}
        aria-pressed={isSaved}
        className={cn(actionClass, isSaved ? onClass : idleClass)}
      >
        <Bookmark className={cn("size-4", isSaved && "fill-current")} />
      </button>
      <button type="button" onClick={handleShare} aria-label="Share" className={cn(actionClass, idleClass)}>
        {copied ? <Check className="size-4 text-verified-text" /> : <Share2 className="size-4" />}
      </button>
    </div>
  );
}
