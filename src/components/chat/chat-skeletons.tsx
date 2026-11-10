import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Inbox rows while conversations load. */
export function InboxRowsSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="space-y-1 p-2" role="status" aria-label="Loading chats">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-28 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-full" />
            </div>
            <Skeleton className={cn("h-3 rounded-full", i % 2 ? "w-1/2" : "w-3/4")} />
          </div>
        </div>
      ))}
    </div>
  );
}

const BUBBLES: { mine: boolean; className: string }[] = [
  { mine: false, className: "h-11 w-52" },
  { mine: true, className: "h-9 w-40" },
  { mine: false, className: "h-28 w-56" },
  { mine: true, className: "h-14 w-60" },
  { mine: false, className: "h-9 w-32" },
];

/** Message bubbles while a thread loads. */
export function ThreadBubblesSkeleton() {
  return (
    <div className="space-y-3 py-2" role="status" aria-label="Loading messages">
      {BUBBLES.map((b, i) => (
        <div key={i} className={cn("flex", b.mine ? "justify-end" : "justify-start")}>
          <Skeleton
            className={cn(
              "max-w-[75%] rounded-lg",
              b.mine ? "rounded-br-sm bg-brand-subtle" : "rounded-bl-sm",
              b.className
            )}
          />
        </div>
      ))}
    </div>
  );
}

/** Thread header + bubbles + composer, used before the participant is known. */
export function ThreadSkeleton() {
  return (
    <div className="flex h-full w-full flex-col bg-bg">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 pt-[env(safe-area-inset-top)]">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-3 py-4 sm:px-6">
        <ThreadBubblesSkeleton />
      </div>
      <div className="shrink-0 border-t border-border bg-surface px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  );
}

/** Inbox column with header, search and rows. */
export function InboxSkeleton() {
  return (
    <div className="flex h-full w-full flex-col bg-surface">
      <div className="space-y-3 border-b border-border p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <Skeleton className="size-11 rounded-full lg:hidden" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-11 w-full rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
      <InboxRowsSkeleton rows={8} />
    </div>
  );
}

/** Route-level skeleton for /chat: inbox on phones, inbox + thread on desktop. */
export function ChatPageSkeleton({ thread = false }: { thread?: boolean }) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-bg">
      <div
        className={cn(
          "h-full w-full shrink-0 border-r border-border md:w-80 lg:w-96",
          thread ? "hidden md:block" : "block"
        )}
      >
        <InboxSkeleton />
      </div>
      <div className={cn("h-full flex-1", thread ? "flex" : "hidden md:flex")}>
        <ThreadSkeleton />
      </div>
    </div>
  );
}
