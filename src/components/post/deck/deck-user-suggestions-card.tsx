"use client";

import { BadgeCheck, ChevronDown, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { trackFollow } from "@/lib/analytics/ga4";
import { cn, getAvatarUrl } from "@/lib/utils";
import type { DeckUserSuggestion } from "./deck-types";

interface DeckUserSuggestionsCardProps {
  users: DeckUserSuggestion[];
  institutionName?: string;
}

export function DeckUserSuggestionsCard({ users, institutionName }: DeckUserSuggestionsCardProps) {
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    users.forEach((u) => {
      init[u.id] = Boolean(u.isFollowing);
    });
    return init;
  });

  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  async function handleToggleFollow(username: string, userId: string) {
    const isCurrentlyFollowing = Boolean(followingMap[userId]);
    setLoadingMap((prev) => ({ ...prev, [userId]: true }));

    // Optimistic
    setFollowingMap((prev) => ({ ...prev, [userId]: !isCurrentlyFollowing }));

    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}/follow`, {
        method: isCurrentlyFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle follow");
      if (!isCurrentlyFollowing) trackFollow(username);
    } catch {
      // Revert
      setFollowingMap((prev) => ({ ...prev, [userId]: isCurrentlyFollowing }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [userId]: false }));
    }
  }

  return (
    <div className="relative w-full h-full max-w-xl mx-auto flex flex-col justify-center px-4 py-4 sm:px-6 select-none overflow-hidden">
      <div className="rounded-xl bg-surface p-5 sm:p-6 border border-border space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-md bg-surface-muted text-fg-muted flex items-center justify-center">
              <Users className="size-4" />
            </div>
            <div>
              <h3 className="text-base">People to follow</h3>
              <p className="text-xs text-muted-foreground">{institutionName || "Students on CampusLoop"}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
            Suggested
          </span>
        </div>

        {/* User list */}
        <div className="space-y-3 pt-1">
          {users.map((user) => {
            const isFollowing = Boolean(followingMap[user.id]);
            const isLoading = Boolean(loadingMap[user.id]);
            const avatarUrl = getAvatarUrl(user.avatarUrl, user.username);

            return (
              <div
                key={user.id}
                className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <Link href={`/@${user.username}`} className="flex items-center gap-3 min-w-0 flex-1 group">
                  <Avatar className="size-11 border border-border shrink-0">
                    <AvatarImage src={avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                      {user.displayName[0] || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="line-clamp-2 break-words font-bold text-sm leading-snug text-foreground group-hover:text-primary transition-colors">
                      {user.displayName}
                      <BadgeCheck
                        className="ml-1 inline size-3.5 align-[-2px] text-verified-text"
                        aria-label="Verified student"
                      />
                    </p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    {(user.branch || user.year) && (
                      <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">
                        {[user.branch, user.year ? `Year ${user.year}` : null].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => handleToggleFollow(user.username, user.id)}
                  disabled={isLoading}
                  aria-pressed={isFollowing}
                  className={cn(
                    buttonVariants({ variant: isFollowing ? "ghost" : "primary", size: "row" }),
                    isFollowing && "text-fg-muted"
                  )}
                >
                  {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <div className="pt-4 text-center text-sm text-fg-muted flex items-center justify-center gap-1">
        <span>Swipe for more</span>
        <ChevronDown className="size-4" aria-hidden />
      </div>
    </div>
  );
}
