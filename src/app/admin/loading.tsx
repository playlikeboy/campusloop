import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2 border-b border-border pb-5">
        <Skeleton className="h-7 w-48 rounded-sm" />
        <Skeleton className="h-4 w-72 max-w-full rounded-sm" />
      </div>
      <Skeleton className="h-20 rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
