import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for the swipe deck: one card plus the three action buttons. */
export function DatingCardSkeleton() {
  return (
    <div
      className="relative mx-auto flex h-full min-h-[min(36dvh,500px)] w-full max-w-sm flex-col gap-3 py-1"
      aria-busy="true"
      aria-label="Loading profiles"
    >
      <div className="relative flex-1 overflow-hidden rounded-xl bg-surface-muted">
        <div className="absolute inset-x-5 bottom-5 space-y-2.5">
          <Skeleton className="h-8 w-44 rounded-full" />
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-4/5" />
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
