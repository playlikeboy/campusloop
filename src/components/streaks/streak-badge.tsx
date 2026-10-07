"use client";

import { Flame } from "lucide-react";
import Link from "next/link";
import { useStreaks } from "@/hooks/use-streaks";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  className?: string;
  href?: string;
}

export function StreakBadge({ className, href = "/feeds" }: StreakBadgeProps) {
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

  return (
    <Link
      href={href}
      title={
        isSafeToday
          ? `${currentStreak}-day streak (Safe today)`
          : `${currentStreak}-day streak (Action needed today)`
      }
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 select-none",
        isSafeToday
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15",
        className
      )}
    >
      <Flame
        className={cn(
          "size-3.5 stroke-[2.2]",
          isSafeToday
            ? "fill-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            : "fill-amber-500/30 text-amber-500 animate-pulse"
        )}
      />
      <span>{currentStreak}</span>
      <span className="hidden sm:inline font-semibold text-[11px] opacity-80">
        {currentStreak === 1 ? "day" : "days"}
      </span>
    </Link>
  );
}
