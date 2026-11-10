import { Skeleton } from "@/components/ui/skeleton";

/** Player skeleton: top bar, video frame, toolbar and tab row. */
export default function LectureLoading() {
  return (
    <div className="flex h-dvh flex-col bg-bg" aria-busy="true">
      <span className="sr-only" role="status">
        Loading lecture
      </span>
      <div className="flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-4 w-48 max-w-[50%]" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="flex gap-2 border-b border-border px-4 py-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="ml-auto h-9 w-20 rounded-full" />
          </div>
          <div className="mx-auto max-w-4xl space-y-3 px-4 py-5">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
        <div className="hidden w-[360px] shrink-0 space-y-2 border-l border-border p-4 lg:block">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
