"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * High-fidelity mobile card skeleton for Campus Match swipe deck.
 * Matches exact geometry, border radius (rounded-[1.75rem]), stack illusion,
 * and tactile bottom action buttons.
 */
export function DatingCardSkeleton() {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-sm flex-col justify-between py-1 select-none">
      {/* Stack illusion back card */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1 bottom-16 rounded-[1.75rem] border border-border/20 bg-muted/20"
        style={{
          transform: "translateY(10px) scale(0.96)",
          zIndex: 0,
        }}
      />

      {/* Top card frame */}
      <div className="relative z-10 flex flex-1 w-full flex-col justify-between overflow-hidden rounded-[1.75rem] border border-border/40 bg-card p-5 shadow-xl">
        {/* Story progress bar skeleton */}
        <div className="absolute inset-x-4 top-3 flex gap-1.5">
          <Skeleton className="h-1 flex-1 rounded-full bg-muted/70" />
          <Skeleton className="h-1 flex-1 rounded-full bg-muted/40" />
          <Skeleton className="h-1 flex-1 rounded-full bg-muted/40" />
        </div>

        {/* Top badge */}
        <div className="pt-2">
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Bottom card details */}
        <div className="space-y-3 pt-6">
          {/* Avatar + Name + Yr */}
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-5 w-10 rounded-md" />
              </div>
              <Skeleton className="h-3.5 w-44 rounded-md" />
            </div>
          </div>

          {/* Interest tags */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>

          {/* Bio text lines */}
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-3/4 rounded-md" />
          </div>
        </div>
      </div>

      {/* Tactile Action Buttons Placeholder */}
      <div className="relative z-10 flex items-center justify-center gap-4 py-3 shrink-0">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="size-14 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Full page skeleton including the top header bar and deck container
 * for 0 Cumulative Layout Shift (CLS = 0) during route transitions.
 */
export function DatingPageSkeleton() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col px-4 bg-background text-foreground select-none">
      {/* Top Bar Skeleton */}
      <header className="flex items-center justify-between py-3 border-b border-border/30">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-md" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </header>

      {/* Main deck frame */}
      <main className="flex min-h-0 flex-1 flex-col py-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <DatingCardSkeleton />
      </main>
    </div>
  );
}
