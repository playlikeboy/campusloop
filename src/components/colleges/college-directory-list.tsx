"use client";

import { ChevronLeft, ChevronRight, School } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { activityLine, type LeaderboardCollegeItem } from "./all-india-college-podium";
import { CollegeHubRow, type CollegeItem } from "./college-hub-row";

export function CollegeListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-12 rounded-sm" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CollegeDirectoryList({
  colleges,
  onRequest,
}: {
  colleges: CollegeItem[];
  onRequest: () => void;
}) {
  if (colleges.length === 0) {
    return (
      <EmptyState
        icon={School}
        bordered
        title="No colleges match that"
        description="Try a shorter name or another state."
        action={<Button onClick={onRequest}>Add your college</Button>}
      />
    );
  }
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {colleges.map((college) => (
        <li key={college.id}>
          <CollegeHubRow college={college} />
        </li>
      ))}
    </ul>
  );
}

export function CollegeStandingsList({ leaderboard }: { leaderboard: LeaderboardCollegeItem[] }) {
  if (leaderboard.length === 0) {
    return (
      <EmptyState
        icon={School}
        bordered
        title="No college activity yet"
        description="Be the first to post from your college."
      />
    );
  }
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {leaderboard.map((item, index) => (
        <li key={item.id}>
          <CollegeHubRow
            college={item}
            rank={index + 1}
            trailing={<span className="text-sm text-fg-muted tabular-nums">{activityLine(item)}</span>}
          />
        </li>
      ))}
    </ol>
  );
}

export function CollegePager({
  page,
  totalPages,
  hrefFor,
  onPage,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const go = (e: React.MouseEvent, next: number) => {
    e.preventDefault();
    if (next < 1 || next > totalPages || next === page) return;
    onPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    // Real ?page= links so crawlers can walk the list; JS keeps it in place.
    <nav aria-label="Pages" className="flex items-center justify-between gap-3 pt-5">
      <Button asChild variant="outline" size="sm">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          rel="prev"
          aria-disabled={page <= 1}
          onClick={(e) => go(e, page - 1)}
          className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
        >
          <ChevronLeft />
          Previous
        </Link>
      </Button>
      <span className="text-sm text-fg-muted tabular-nums">
        Page {page} of {totalPages}
      </span>
      <Button asChild variant="outline" size="sm">
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          rel="next"
          aria-disabled={page >= totalPages}
          onClick={(e) => go(e, page + 1)}
          className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
        >
          Next
          <ChevronRight />
        </Link>
      </Button>
    </nav>
  );
}
