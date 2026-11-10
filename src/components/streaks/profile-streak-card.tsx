"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStreaks } from "@/hooks/use-streaks";
import { cn } from "@/lib/utils";
import { StreakWeek } from "./streak-week";

interface ProfileStreakCardProps {
  className?: string;
  profileId?: string;
}

/** Calm streak summary: current run, best run and the last 7 days. */
export function ProfileStreakCard({ className, profileId }: ProfileStreakCardProps) {
  const { streak, isLoading, isError } = useStreaks(profileId);

  if (isLoading) {
    return <Skeleton className={cn("h-44 rounded-lg", className)} />;
  }
  if (isError || !streak) {
    return (
      <p className={cn("rounded-lg border border-border bg-surface p-4 text-sm text-fg-muted", className)}>
        Couldn't load the streak. Try again in a minute.
      </p>
    );
  }

  const { currentStreak, longestStreak, isSafeToday, weeklyTracker } = streak;
  const href = profileId ? `/streaks?profileId=${encodeURIComponent(profileId)}` : "/streaks";

  return (
    <section className={cn("space-y-4 rounded-lg border border-border bg-surface p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg text-fg">
            {currentStreak} {currentStreak === 1 ? "day" : "days"} in a row
          </h2>
          <p className="text-sm text-fg-muted">
            Best: {longestStreak} {longestStreak === 1 ? "day" : "days"}
          </p>
        </div>
        {isSafeToday && <Badge variant="verified">Streak safe today</Badge>}
      </div>
      <StreakWeek days={weeklyTracker} />
      <Link
        href={href}
        className="flex min-h-11 items-center justify-between rounded-md text-sm font-semibold text-brand-text outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        See full streak
        <ChevronRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}
