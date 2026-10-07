import { DatingCardSkeleton } from "@/components/dating/dating-card-skeleton";

export default function DatingLoading() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-2">
      <DatingCardSkeleton />
    </div>
  );
}
