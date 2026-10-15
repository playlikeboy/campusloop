import { FeedSkeleton } from "@/components/ui/skeleton-card";

export default function FeedsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1020px] justify-center gap-8">
      <div className="min-h-screen w-full max-w-[640px] sm:border-x border-border/40 select-none">
        <div className="h-12 border-b border-border/40" />
        <FeedSkeleton />
      </div>
      <div className="hidden w-[340px] shrink-0 lg:block" />
    </div>
  );
}
