"use client";

import { Flame } from "lucide-react";
import Link from "next/link";
import { useStreaks } from "@/hooks/use-streaks";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  className?: string;
  href?: string;
}

/** Small streak count chip. Mint once today is done, neutral otherwise. */
export function StreakBadge({ className, href = "/streaks" }: StreakBadgeProps) {
  const { streak, isLoading } = useStreaks();
  const base =
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold tabular-nums select-none";

  if (isLoading || !streak) {
    return (
      <span className={cn(base, "bg-surface-muted text-fg-subtle", className)} aria-hidden="true">
        <Flame className="size-4" />
        <span className="h-3 w-4 rounded-xs bg-surface-sunken" />
      </span>
    );
  }

  const { currentStreak, isSafeToday } = streak;
  const label = `${currentStreak}-day streak${isSafeToday ? ", safe today" : ""}`;

  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={cn(
        base,
        "transition-ui active:scale-95",
        isSafeToday
          ? "bg-verified-subtle text-verified-text"
          : "bg-surface-muted text-fg hover:bg-surface-sunken",
        className
      )}
    >
      <Flame aria-hidden="true" className="size-4" />
      <span>{currentStreak}</span>
      <span className="hidden font-medium sm:inline">{currentStreak === 1 ? "day" : "days"}</span>
    </Link>
  );
}
