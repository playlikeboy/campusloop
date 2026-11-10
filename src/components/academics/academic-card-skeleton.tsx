"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Placeholder rows shaped like the study material list. */
export function AcademicCardSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading study material"
      className={cn(
        "divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
