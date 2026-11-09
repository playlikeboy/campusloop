"use client";

import { Flame } from "lucide-react";
import Link from "next/link";
import { useStreaks } from "@/hooks/use-streaks";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  className?: string;
  href?: string;
}

export function StreakBadge({ className, href = "/streaks" }: StreakBadgeProps) {
  const { streak, isLoading } = useStreaks();

  if (isLoading || !streak) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-border/30 bg-muted/20 text-xs font-bold text-muted-foreground animate-pulse",
          className
        )}
      >
        <Flame className="size-3.5 text-muted-foreground/50" />
        <span className="h-3 w-4 rounded bg-muted/60" />
      </div>
    );
  }

  const { currentStreak, isSafeToday } = streak;
  const displayStreak = Math.max(1, currentStreak);

  return (
    <Link
      href={href}
      title={
        isSafeToday
          ? `${displayStreak}-day streak (Safe today)`
          : `${displayStreak}-day streak (Action needed today)`
      }
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-transform cursor-pointer active:scale-95 select-none",
        isSafeToday
          ? "border-success/25 bg-success/10 text-success"
          : "border-reward/30 bg-reward/10 text-reward-text hover:bg-reward/15",
        className
      )}
    >
      <Flame
        className={cn(
          "size-3.5 stroke-[2.2]",
          isSafeToday
            ? "fill-success/30 text-success"
            : "fill-reward/30 text-reward-text animate-pulse"
        )}
      />
      <span>{displayStreak}</span>
      <span className="hidden sm:inline font-semibold text-[11px] opacity-80">
        {displayStreak === 1 ? "day" : "days"}
      </span>
    </Link>
  );
}
