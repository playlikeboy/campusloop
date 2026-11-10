"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CollegeCrest, shortCollegeName } from "./college-crest";
import type { CollegeItem } from "./college-hub-row";

export interface LeaderboardCollegeItem extends CollegeItem {
  points: number;
  studentCount: number;
  postCount: number;
  rank: number;
}

interface AllIndiaCollegePodiumProps {
  leaderboard: LeaderboardCollegeItem[];
  loading?: boolean;
  compact?: boolean;
  className?: string;
  onExploreMore?: () => void;
}

export function activityLine(item: { studentCount?: number; postCount?: number }) {
  const parts: string[] = [];
  if (item.studentCount) parts.push(`${item.studentCount.toLocaleString("en-IN")} students`);
  if (item.postCount) parts.push(`${item.postCount.toLocaleString("en-IN")} posts`);
  return parts.join(" · ") || "Just getting started";
}

/** Top three colleges by student activity, as three rows on a calm card. */
export function AllIndiaCollegePodium({
  leaderboard,
  loading = false,
  className,
  onExploreMore,
}: AllIndiaCollegePodiumProps) {
  if (loading) {
    return (
      <div className={cn("space-y-3 rounded-lg border border-border bg-surface p-4", className)}>
        <Skeleton className="h-5 w-40" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-sm" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (leaderboard.length < 3) return null;

  return (
    <section
      aria-labelledby="most-active-colleges"
      className={cn("rounded-lg border border-border bg-surface p-4 sm:p-5", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="most-active-colleges" className="text-lg font-bold text-fg">
          Most active colleges
        </h2>
        {onExploreMore && (
          <Button variant="ghost" size="sm" onClick={onExploreMore}>
            See all
            <ArrowRight />
          </Button>
        )}
      </div>

      <ol className="mt-3 divide-y divide-border">
        {leaderboard.slice(0, 3).map((item, index) => (
          <li key={item.id}>
            <Link
              href={`/college/${item.slug || item.id}`}
              className="group flex min-h-14 items-center gap-3 py-2.5 transition-ui"
            >
              <span
                className={cn(
                  "w-6 shrink-0 text-center font-display text-lg font-bold tabular-nums",
                  index === 0 ? "text-brand-text" : "text-fg-subtle"
                )}
              >
                {index + 1}
              </span>
              <CollegeCrest name={item.name} logoUrl={item.logoUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-fg group-hover:text-brand-text">
                  {shortCollegeName(item.name)}
                </p>
                <p className="truncate text-sm text-fg-muted">{activityLine(item)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
