import { cn } from "@/lib/utils";

interface EventCardSkeletonProps {
  variant?: "row" | "grid" | "list";
}

export function EventCardSkeleton({ variant = "row" }: EventCardSkeletonProps) {
  if (variant === "grid") {
    return (
      <div className="relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs">
        {/* Banner shimmer */}
        <div className="relative aspect-16/9 w-full bg-muted/50 skeleton-shimmer">
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <div className="h-5 w-20 rounded-md bg-muted/80" />
            <div className="h-5 w-12 rounded-md bg-muted/80" />
          </div>
          <div className="absolute top-2.5 right-2.5">
            <div className="h-5 w-16 rounded-md bg-muted/80" />
          </div>
          <div className="absolute bottom-2 left-2.5">
            <div className="h-4 w-28 rounded-md bg-muted/80" />
          </div>
        </div>

        {/* Content shimmer */}
        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="size-4.5 rounded-full bg-muted/70 skeleton-shimmer shrink-0" />
              <div className="h-3.5 w-32 rounded bg-muted/70 skeleton-shimmer" />
            </div>
            <div className="h-5 w-4/5 rounded bg-muted/80 skeleton-shimmer" />
            <div className="h-3.5 w-2/3 rounded bg-muted/60 skeleton-shimmer" />
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-border/40">
            <div className="h-3.5 w-24 rounded bg-muted/60 skeleton-shimmer" />
            <div className="h-3.5 w-20 rounded bg-muted/60 skeleton-shimmer" />
          </div>
        </div>

        {/* Footer shimmer */}
        <div className="flex items-center justify-between border-t border-border/40 px-3.5 sm:px-4 py-2.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div className="size-5 rounded-full bg-muted/80 border-2 border-background skeleton-shimmer" />
              <div className="size-5 rounded-full bg-muted/80 border-2 border-background skeleton-shimmer" />
              <div className="size-5 rounded-full bg-muted/80 border-2 border-background skeleton-shimmer" />
            </div>
            <div className="h-3 w-16 rounded bg-muted/60 skeleton-shimmer" />
          </div>
          <div className="h-7 w-20 rounded-lg bg-muted/70 skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-border/60 bg-card shadow-2xs">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Thumbnail shimmer */}
        <div className="size-20 sm:size-24 shrink-0 rounded-xl bg-muted/50 skeleton-shimmer aspect-square border border-border/30" />

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-28 rounded bg-muted/70 skeleton-shimmer" />
            <div className="h-3.5 w-16 rounded bg-muted/50 skeleton-shimmer" />
            <div className="h-3.5 w-20 rounded bg-muted/50 skeleton-shimmer" />
          </div>

          <div className="h-5 w-3/4 rounded bg-muted/80 skeleton-shimmer" />
          <div className="h-3.5 w-1/2 rounded bg-muted/60 skeleton-shimmer" />

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="h-3 w-20 rounded bg-muted/60 skeleton-shimmer" />
            <div className="h-3 w-24 rounded bg-muted/60 skeleton-shimmer" />
            <div className="h-3 w-28 rounded bg-muted/60 skeleton-shimmer" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
        <div className="h-3 w-16 rounded bg-muted/60 skeleton-shimmer sm:hidden" />
        <div className="flex items-center gap-1.5">
          <div className="size-7.5 rounded-lg bg-muted/60 skeleton-shimmer" />
          <div className="size-7.5 rounded-lg bg-muted/60 skeleton-shimmer" />
          <div className="h-7.5 w-20 rounded-lg bg-muted/70 skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function EventMetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-3.5 space-y-2 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-muted/60 skeleton-shimmer" />
            <div className="h-3 w-10 rounded-full bg-muted/50 skeleton-shimmer" />
          </div>
          <div className="space-y-1">
            <div className="h-6 w-20 rounded bg-muted/80 skeleton-shimmer" />
            <div className="h-3 w-24 rounded bg-muted/50 skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventFeaturedSkeleton() {
  return (
    <div className="py-4">
      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-36 rounded-md bg-muted/70 skeleton-shimmer" />
            <div className="h-4 w-28 rounded bg-muted/50 skeleton-shimmer" />
          </div>
          <div className="h-6 w-32 rounded-md bg-muted/60 skeleton-shimmer" />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-2">
            <div className="h-6 w-3/4 rounded bg-muted/80 skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded bg-muted/60 skeleton-shimmer" />
            <div className="flex items-center gap-3 pt-1">
              <div className="h-3.5 w-16 rounded bg-muted/50 skeleton-shimmer" />
              <div className="h-3.5 w-20 rounded bg-muted/50 skeleton-shimmer" />
              <div className="h-3.5 w-24 rounded bg-muted/50 skeleton-shimmer" />
            </div>
          </div>
          <div className="h-9 w-36 rounded-xl bg-muted/70 skeleton-shimmer self-center" />
        </div>
      </div>
    </div>
  );
}

export function EventsListSkeleton({
  count = 6,
  variant = "row",
}: {
  count?: number;
  variant?: "row" | "grid" | "list";
}) {
  return (
    <div
      className={cn(
        variant === "grid"
          ? "grid gap-3.5 sm:gap-4 sm:grid-cols-2"
          : "space-y-3"
      )}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <EventCardSkeleton key={idx} variant={variant} />
      ))}
    </div>
  );
}
