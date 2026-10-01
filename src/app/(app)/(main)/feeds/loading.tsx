import { StoryRingSkeleton, FeedSkeleton } from "@/components/ui/skeleton-card";

export default function FeedsLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto border-x border-border/20 min-h-screen select-none">
      <StoryRingSkeleton />
      <FeedSkeleton />
    </div>
  );
}
