"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AcademicCardSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("divide-y divide-border/20 rounded-2xl border border-border/30 bg-card/20 overflow-hidden", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 sm:p-5 space-y-3 animate-pulse">
          {/* Top row: Avatar + Contributor name + Share placeholder */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-2.5 w-20 rounded-md" />
              </div>
            </div>
            <Skeleton className="size-6 rounded-full" />
          </div>

          {/* Context Line: Code · Subject | Sem · Branch · Type */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>

          {/* Title Placeholder */}
          <div className="space-y-1.5 pt-0.5">
            <Skeleton className="h-5 w-4/5 rounded-md" />
            <Skeleton className="h-3.5 w-full rounded-md" />
          </div>

          {/* Quality badge placeholder */}
          <Skeleton className="h-4 w-28 rounded-full" />

          {/* Actions Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/15">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded-xl" />
              <Skeleton className="h-8 w-12 rounded-xl" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-14 rounded-full" />
              <Skeleton className="h-8 w-18 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
