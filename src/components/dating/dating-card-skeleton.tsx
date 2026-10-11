"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DatingCardSkeleton() {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-sm flex-col gap-4 py-1 select-none" aria-label="Loading student profiles">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-card shadow-lg">
        <div className="relative min-h-[48%] flex-1 overflow-hidden bg-muted/40 skeleton-shimmer">
          <div className="absolute inset-x-4 top-4 flex gap-1.5">
            <Skeleton className="h-1 flex-1 rounded-full bg-white/45" />
            <Skeleton className="h-1 flex-1 rounded-full bg-white/20" />
            <Skeleton className="h-1 flex-1 rounded-full bg-white/20" />
          </div>
          <div className="absolute inset-x-4 bottom-4 space-y-2">
            <Skeleton className="h-7 w-40 rounded-full bg-white/35" />
            <Skeleton className="h-4 w-28 rounded-full bg-white/25" />
          </div>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-36 max-w-full rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
            <Skeleton className="size-8 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-4/5 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-center gap-4 py-1">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="size-14 rounded-full" />
      </div>
    </div>
  );
}

export function DatingPageSkeleton() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col px-4 bg-background text-foreground select-none">
      <header className="flex items-center justify-between py-3">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="size-9 rounded-full" />
      </header>
      <main className="flex min-h-0 flex-1 flex-col py-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <DatingCardSkeleton />
      </main>
    </div>
  );
}
