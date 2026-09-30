"use client";

import { Flame, MessageCircle, Repeat2, Users } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FeedSocialActor, FeedSocialContext, SocialActivityType } from "@/hooks/use-feed";
import { cn } from "@/lib/utils";

interface FeedSocialContextProps {
  socialContext?: FeedSocialContext | null;
  className?: string;
}

function getActionVerb(actions: SocialActivityType[]): string {
  const hasLike = actions.includes("LIKE");
  const hasComment = actions.includes("COMMENT");
  const hasRepost = actions.includes("REPOST");

  if (hasLike && hasRepost && hasComment) return "vibed, commented & reposted this";
  if (hasLike && hasRepost) return "vibed & reposted this";
  if (hasLike && hasComment) return "vibed & commented on this";
  if (hasComment && hasRepost) return "commented & reposted this";
  if (hasLike) return "vibed this";
  if (hasComment) return "commented on this";
  if (hasRepost) return "reposted this";
  return "interacted with this";
}

function getContextIcon(actors: FeedSocialActor[]) {
  // Determine dominant icon based on primary actions
  let likeCount = 0;
  let commentCount = 0;
  let repostCount = 0;

  for (const a of actors) {
    if (a.actions.includes("LIKE")) likeCount++;
    if (a.actions.includes("COMMENT")) commentCount++;
    if (a.actions.includes("REPOST")) repostCount++;
  }

  if (likeCount >= commentCount && likeCount >= repostCount && likeCount > 0) {
    return <Flame className="size-3 text-orange-500 fill-orange-500 shrink-0" />;
  }
  if (repostCount >= commentCount && repostCount > 0) {
    return <Repeat2 className="size-3 text-emerald-500 shrink-0" strokeWidth={2.5} />;
  }
  if (commentCount > 0) {
    return <MessageCircle className="size-3 text-sky-500 shrink-0" />;
  }
  return <Users className="size-3 text-primary shrink-0" />;
}

export function FeedSocialContextBar({ socialContext, className }: FeedSocialContextProps) {
  if (!socialContext || !socialContext.actors || socialContext.actors.length === 0) {
    return null;
  }

  const { actors, totalActors } = socialContext;
  const visibleActors = actors.slice(0, 3);
  const icon = getContextIcon(actors);

  return (
    <div
      className={cn(
        "w-fit max-w-full flex items-center gap-1.5 py-0.5 px-1.5 -ml-1 rounded-md text-[11px] sm:text-xs text-muted-foreground/90 transition-colors select-none",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Overlapping Micro-Avatars */}
      <div className="flex -space-x-1.5 overflow-hidden shrink-0 items-center">
        {visibleActors.map((actor) => (
          <Link
            key={actor.id}
            href={`/@${actor.username}`}
            onClick={(e) => e.stopPropagation()}
            title={actor.displayName || `@${actor.username}`}
            className="relative inline-block transition-transform hover:scale-110 hover:z-10 focus-visible:outline-none"
          >
            <Avatar className="size-4 sm:size-4.5 ring-1.5 ring-background shadow-2xs">
              {actor.avatarUrl && (
                <AvatarImage src={actor.avatarUrl} alt={actor.displayName || actor.username} />
              )}
              <AvatarFallback className="text-[8px] font-bold bg-muted text-muted-foreground uppercase">
                {(actor.displayName || actor.username || "U").slice(0, 1)}
              </AvatarFallback>
            </Avatar>
          </Link>
        ))}
      </div>

      {/* Action Indicator Icon */}
      <div className="flex items-center shrink-0">{icon}</div>

      {/* Dynamic Activity Grammar */}
      <div className="min-w-0 truncate text-foreground/80 leading-none">
        {actors.length === 1 && (
          <span>
            <Link
              href={`/@${actors[0].username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-foreground hover:underline hover:text-primary transition-colors"
            >
              {actors[0].displayName || `@${actors[0].username}`}
            </Link>{" "}
            <span className="text-muted-foreground">{getActionVerb(actors[0].actions)}</span>
          </span>
        )}

        {actors.length === 2 && (
          <span>
            <Link
              href={`/@${actors[0].username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-foreground hover:underline hover:text-primary transition-colors"
            >
              {actors[0].displayName?.split(" ")[0] || `@${actors[0].username}`}
            </Link>{" "}
            and{" "}
            <Link
              href={`/@${actors[1].username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-foreground hover:underline hover:text-primary transition-colors"
            >
              {actors[1].displayName?.split(" ")[0] || `@${actors[1].username}`}
            </Link>{" "}
            <span className="text-muted-foreground">
              {actors[0].actions.length === 1 &&
              actors[1].actions.length === 1 &&
              actors[0].actions[0] === actors[1].actions[0]
                ? getActionVerb(actors[0].actions)
                : "interacted with this"}
            </span>
          </span>
        )}

        {actors.length >= 3 && (
          <span>
            <Link
              href={`/@${actors[0].username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-foreground hover:underline hover:text-primary transition-colors"
            >
              {actors[0].displayName?.split(" ")[0] || `@${actors[0].username}`}
            </Link>
            ,{" "}
            <Link
              href={`/@${actors[1].username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-foreground hover:underline hover:text-primary transition-colors"
            >
              {actors[1].displayName?.split(" ")[0] || `@${actors[1].username}`}
            </Link>{" "}
            and{" "}
            <span className="font-semibold text-foreground">
              {totalActors - 2} other{totalActors - 2 > 1 ? "s" : ""}
            </span>{" "}
            <span className="text-muted-foreground">
              {actors.every((a) => a.actions.length === 1 && a.actions[0] === "LIKE")
                ? "vibed this"
                : "interacted"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
