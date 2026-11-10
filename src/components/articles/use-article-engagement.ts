"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ARTICLES_CANONICAL_HOST } from "@/constants/articles";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface EngagementInput {
  slug: string;
  title: string;
  excerpt?: string | null;
  authorId: string;
  authorUsername?: string | null;
  viewerId?: string | null;
  initialUpvotes: number;
  initialUserVote: number;
  initialIsSaved: boolean;
  initialIsFollowing: boolean;
}

/** Upvote, save, follow and share state for the article reader. Optimistic, rolls back with a toast on failure. */
export function useArticleEngagement(input: EngagementInput) {
  const [userVote, setUserVote] = useState(input.initialUserVote);
  const [upvotes, setUpvotes] = useState(input.initialUpvotes);
  const [isSaved, setIsSaved] = useState(input.initialIsSaved);
  const [isFollowing, setIsFollowing] = useState(input.initialIsFollowing);
  const [copied, setCopied] = useState(false);

  async function toggleVote() {
    sounds.tap();
    haptics.medium();
    const prevVote = userVote;
    const nextVote = prevVote === 1 ? 0 : 1;
    setUserVote(nextVote);
    setUpvotes((prev) => prev + (nextVote === 1 ? 1 : -1));
    try {
      const res = await fetch(`/api/articles/${input.slug}/vote`, {
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

  async function toggleSave() {
    sounds.tap();
    haptics.light();
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);
    try {
      const res = await fetch(`/api/articles/${input.slug}/save`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { isSaved?: boolean };
      setIsSaved(Boolean(data.isSaved));
      toast.success(data.isSaved ? "Saved" : "Removed from saved");
    } catch {
      setIsSaved(prevSaved);
      toast.error("Couldn't save. Sign in and try again.");
    }
  }

  async function toggleFollow() {
    if (!input.viewerId) {
      toast.info("Sign in to follow writers.");
      return;
    }
    if (input.viewerId === input.authorId) return;
    sounds.tap();
    haptics.light();
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      const res = await fetch(`/api/users/${input.authorUsername}/follow`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success(next ? `Following @${input.authorUsername}` : "Unfollowed");
    } catch {
      setIsFollowing(!next);
      toast.error("Couldn't update follow. Try again.");
    }
  }

  function share() {
    const url = `${ARTICLES_CANONICAL_HOST}/articles/${input.slug}`;
    if (navigator.share) {
      navigator.share({ title: input.title, text: input.excerpt || input.title, url }).catch(() => {});
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        toast.success("Link copied");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Couldn't copy the link. Copy it from the address bar."));
  }

  return { userVote, upvotes, isSaved, isFollowing, copied, toggleVote, toggleSave, toggleFollow, share };
}

export type ArticleEngagement = ReturnType<typeof useArticleEngagement>;
