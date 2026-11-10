import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/** Centered spinner for whole-page route loads (public pages). */
export function PageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg text-brand-text">
      <Spinner size="lg" label="Loading page" />
    </div>
  );
}

/** Calm feed-column skeleton for in-app route loads. No header: the shell's own chrome stays. */
export function AppPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="mx-auto w-full max-w-2xl space-y-4 px-[var(--gutter)] py-6"
    >
      <Skeleton className="h-8 w-40 rounded-full" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-3.5 w-full rounded-full" />
          <Skeleton className="h-3.5 w-4/5 rounded-full" />
        </div>
      ))}
    </div>
  );
}
