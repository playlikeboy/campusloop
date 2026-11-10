import { FeedSkeleton } from "@/components/ui/skeleton-card";

export default function FeedsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1020px] justify-center gap-8">
      <div
        className="min-h-screen w-full max-w-[640px] select-none border-border sm:border-x"
        aria-busy="true"
      >
        <span className="sr-only">Loading your feed</span>
        <div className="h-12 border-b border-border" />
        <FeedSkeleton />
      </div>
      <div className="hidden w-[340px] shrink-0 lg:block" />
    </div>
  );
}
