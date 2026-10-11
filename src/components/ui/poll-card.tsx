"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { FeedPost } from "@/hooks/use-feed";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface PollCardProps {
  post: FeedPost;
}

export function PollCard({ post }: PollCardProps) {
  const [hasVoted, setHasVoted] = useState(post.hasVotedPoll || false);
  const [options, setOptions] = useState(post.pollOptions || []);
  const [totalVotes, setTotalVotes] = useState(post.totalPollVotes || 0);
  const [isLoading, setIsLoading] = useState(false);

  async function handleVote(optionId: string) {
    if (isLoading || hasVoted) return;

    sounds.tap();
    haptics.light();

    // Optimistic Update
    setIsLoading(true);
    setHasVoted(true);
    setTotalVotes(totalVotes + 1);
    setOptions((prev) =>
      prev.map((opt) => {
        if (opt.id === optionId) {
          return { ...opt, votesCount: opt.votesCount + 1, userVoted: true };
        }
        return opt;
      })
    );

    try {
      const res = await fetch(`/api/posts/${post.id}/poll-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });

      if (!res.ok) {
        throw new Error("Failed to cast poll vote");
      }
    } catch (err) {
      console.error(err);
      // Revert optimistic update
      setHasVoted(false);
      setTotalVotes(totalVotes);
      setOptions(post.pollOptions || []);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2 mt-2.5">
      {options.map((option) => {
        const percentage = totalVotes > 0 ? Math.round((option.votesCount / totalVotes) * 100) : 0;

        return (
          <div
            key={option.id}
            className={cn(
              "relative overflow-hidden rounded-xl border transition-all",
              option.userVoted
                ? "border-primary/40 bg-card shadow-2xs"
                : "border-border/60 bg-card/60 hover:border-border"
            )}
          >
            {hasVoted ? (
              <>
                {/* Progress bar background fill */}
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 transition-all duration-500",
                    option.userVoted ? "bg-primary/20" : "bg-muted/40"
                  )}
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex justify-between items-center px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-foreground">
                  <span
                    className={cn(
                      "font-medium flex items-center gap-1.5",
                      option.userVoted ? "text-primary font-bold" : "text-foreground"
                    )}
                  >
                    <span>{option.text}</span>
                    {option.userVoted && (
                      <Check className="size-3.5 text-primary shrink-0" aria-label="Your choice" />
                    )}
                  </span>
                  <span className="font-bold text-xs text-muted-foreground tabular-nums shrink-0 ml-2">
                    {percentage}%
                  </span>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleVote(option.id)}
                disabled={isLoading}
                className="w-full text-left px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-foreground font-medium hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>{option.text}</span>
              </button>
            )}
          </div>
        );
      })}

      {hasVoted && (
        <p className="text-[11px] font-medium text-muted-foreground px-1 pt-0.5">
          {totalVotes} {totalVotes === 1 ? "student vote" : "student votes"}
        </p>
      )}
    </div>
  );
}
