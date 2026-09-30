import { Skeleton } from "@/components/ui/skeleton";
import { CommunitySkeleton } from "@/components/ui/skeleton-card";

export default function CommunitiesLoading() {
  return (
    <div className="space-y-6 pt-4 px-4 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>
      <CommunitySkeleton />
    </div>
  );
}
