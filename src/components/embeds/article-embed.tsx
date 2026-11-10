"use client";

import { ArrowRight, BookOpen, Clock, Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { getAvatarUrl } from "@/lib/utils";

interface ArticleEmbedProps {
  slug: string;
}

interface ArticleData {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  category: string;
  readingTimeMinutes: number;
  upvotesCount: number;
  viewsCount: number;
  userVote?: number;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export function ArticleEmbed({ slug }: ArticleEmbedProps) {
  const { data, isLoading } = useSWR<{ article: ArticleData }>(
    slug ? `/api/articles/${slug}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const article = data?.article;
  const [isVoting, setIsVoting] = useState(false);
  const [voted, setVoted] = useState<boolean | null>(null);
  const [upvotesCount, setUpvotesCount] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="mt-2.5 p-3 rounded-2xl border border-border bg-card animate-pulse flex items-center gap-3">
        <div className="size-12 rounded-xl bg-muted/60" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-muted/60 rounded-md w-3/4" />
          <div className="h-3 bg-muted/40 rounded-md w-1/2" />
        </div>
      </div>
    );
  }

  if (!article) return null;

  const isUpvoted = voted !== null ? voted : article.userVote === 1;
  const currentVotes = upvotesCount !== null ? upvotesCount : article.upvotesCount;

  async function handleToggleVote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!article || isVoting) return;

    setIsVoting(true);
    const nextVote = !isUpvoted;
    setVoted(nextVote);
    setUpvotesCount((prev) => (prev !== null ? prev : article.upvotesCount) + (nextVote ? 1 : -1));

    try {
      sounds.pop();
      haptics.light();
      const res = await fetch(`/api/articles/${article.slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: nextVote ? 1 : 0 }),
      });

      if (!res.ok) {
        throw new Error("Failed to vote");
      }

      toast.success(nextVote ? "Upvoted article!" : "Vote removed");
      mutate(`/api/articles/${slug}`);
    } catch {
      // Revert optimistic
      setVoted(!nextVote);
      setUpvotesCount((prev) => (prev !== null ? prev : article.upvotesCount));
      toast.error("Couldn't save your vote. Try again.");
    } finally {
      setIsVoting(false);
    }
  }

  const authorAvatar = getAvatarUrl(article.author.avatarUrl, article.author.username);

  return (
    <Link
      href={`/articles/${article.slug}`}
      onClick={(e) => e.stopPropagation()}
      className="mt-2.5 block overflow-hidden rounded-2xl border border-border bg-card hover:bg-muted/15 transition-colors shadow-xs group"
    >
      {article.coverImageUrl && (
        <div className="relative aspect-24/10 w-full overflow-hidden bg-muted/30">
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="rounded-md bg-black/75 px-2 py-0.5 text-xs font-semibold text-white flex items-center gap-1">
              <BookOpen className="size-3 text-brand-text" />
              {article.category.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}

      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar className="size-5 shrink-0 border border-border">
              <AvatarImage src={authorAvatar} alt={article.author.displayName} />
              <AvatarFallback className="text-xs font-bold">{article.author.displayName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-bold text-foreground/80 truncate">
              {article.author.displayName}
            </span>
            <span className="text-xs text-muted-foreground truncate">@{article.author.username}</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground shrink-0">
            <Clock className="size-3 text-muted-foreground" />
            <span>{article.readingTimeMinutes} min read</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm text-foreground group-hover:underline line-clamp-1">
            {article.title}
          </h4>
          {(article.subtitle || article.excerpt) && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 font-medium leading-relaxed">
              {article.subtitle || article.excerpt}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-border">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleVote}
            disabled={isVoting}
            className={`h-7 px-2.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
              isUpvoted
                ? "bg-danger/15 text-danger hover:bg-danger/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Heart className={`size-3.5 mr-1 ${isUpvoted ? "fill-danger text-danger" : ""}`} />
            <span>{currentVotes}</span>
          </Button>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
            <span>Read article</span>
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
