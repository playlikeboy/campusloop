import { Skeleton } from "@/components/ui/skeleton";

export default function MarketplaceLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5" aria-busy="true" aria-label="Loading marketplace">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-11 w-full rounded-md" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      {[0, 1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-3">
          <Skeleton className="size-20 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
