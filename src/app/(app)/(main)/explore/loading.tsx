import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl min-h-screen px-3 sm:px-6 py-4 pb-28 space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-8 w-44 rounded-full" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>

      {/* Quick Explore Chips Skeleton */}
      <div className="flex gap-2 overflow-hidden py-1">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Pulse Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>

      {/* Section Previews Skeletons */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
