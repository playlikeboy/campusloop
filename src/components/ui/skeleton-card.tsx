import { Skeleton } from "./skeleton";

// ──────── 1. Story Ring Skeleton ────────

export function StoryRingSkeleton() {
  return (
    <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-2.5 px-4 border-b border-border/30 select-none">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-2.5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ──────── 2. Twitter / X 2-Column Post Item Skeleton ────────

function SinglePostSkeleton({ hasMedia }: { hasMedia?: boolean }) {
  return (
    <div className="border-b border-border/30 px-4 py-3.5 flex gap-3 select-none">
      {/* Left Avatar */}
      <Skeleton className="size-10 rounded-full shrink-0" />

      {/* Right Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="size-1 rounded-full" />
            <Skeleton className="h-3 w-8 rounded-full" />
          </div>
          <Skeleton className="size-4 rounded-full" />
        </div>

        {/* Minimal HR divider */}
        <hr className="border-t border-border/20 my-1.5" />

        {/* Text body lines */}
        <div className="space-y-2 pt-0.5">
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-5/6 rounded-md" />
          <Skeleton className="h-3.5 w-2/3 rounded-md" />
        </div>

        {/* Optional Media Box */}
        {hasMedia && <Skeleton className="h-48 w-full rounded-2xl mt-2.5" />}

        {/* Actions bar */}
        <div className="flex items-center justify-between max-w-md pt-2">
          <Skeleton className="h-4 w-10 rounded-full" />
          <Skeleton className="h-4 w-8 rounded-full" />
          <Skeleton className="h-4 w-10 rounded-full" />
          <Skeleton className="h-4 w-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ──────── 3. Feed Skeleton (Initial Page Load) ────────

export function FeedSkeleton() {
  return (
    <div className="divide-y divide-border/30 select-none">
      <SinglePostSkeleton />
      <SinglePostSkeleton hasMedia />
      <SinglePostSkeleton />
      <SinglePostSkeleton />
    </div>
  );
}

// ──────── 3b. Confessions Feed Skeleton ────────

export function ConfessionsFeedSkeleton() {
  return (
    <div className="divide-y divide-border/25 select-none">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Skeleton className="size-5 rounded-full" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-28 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
                <Skeleton className="h-2.5 w-36 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="space-y-2 pt-1 pl-11">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-4/5 rounded-md" />
            <Skeleton className="h-3.5 w-2/3 rounded-md" />
          </div>

          <div className="flex items-center justify-between pl-11 pt-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────── 4. Infinite Scroll Loading Skeletons ────────

export function FeedLoadingMoreSkeleton() {
  return (
    <div className="divide-y divide-border/30 select-none py-1 animate-in fade-in duration-200">
      <SinglePostSkeleton />
      <SinglePostSkeleton />
    </div>
  );
}

// ──────── 5. Post Detail & Thread Skeleton ────────

export function PostDetailSkeleton() {
  return (
    <div className="relative w-full h-dvh overflow-hidden bg-background select-none">
      {/* Ambient Glow in Background */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] bg-purple-600/10 blur-[140px] rounded-full -z-10" />

      {/* Top Header & Subheader Filter Tabs Skeleton */}
      <header className="absolute top-0 inset-x-0 z-30 px-4 pt-2.5 pb-1 bg-gradient-to-b from-background/95 via-background/85 to-transparent backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mt-3 border-b border-border/20 pb-1.5">
          <div className="flex items-center gap-5 sm:gap-6 py-0.5">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
          <Skeleton className="size-9 rounded-full shrink-0 border border-border/40" />
        </div>
      </header>

      {/* Centered Post Reel Deck Content Skeleton (Matches PostReelCard bounds) */}
      <div className="absolute inset-x-0 top-[88px] sm:top-[92px] bottom-[72px] md:bottom-0 overflow-hidden flex flex-col justify-between px-4 py-3 sm:px-8 sm:py-5 max-w-2xl mx-auto">
        {/* Top Author Header */}
        <div className="flex items-center justify-between gap-3 min-w-0 pr-16 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="size-10 sm:size-11 rounded-full shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
              <div className="flex items-center gap-1.5 pt-0.5">
                <Skeleton className="size-2 rounded-full shrink-0" />
                <Skeleton className="h-2.5 w-36 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-7 w-20 rounded-full shrink-0" />
        </div>

        {/* Main Content Body */}
        <div className="flex-1 min-h-0 flex flex-col justify-start pr-14 sm:pr-16 space-y-4 py-4">
          <Skeleton className="h-6 sm:h-7 w-3/4 rounded-xl" />
          <div className="space-y-2.5 pt-1">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-11/12 rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>

        {/* Bottom context spacer */}
        <div className="h-4 shrink-0" />
      </div>

      {/* Right Floating Side Action Rail Skeleton (Like, Comment, Loop, Bookmark, Share, More) */}
      <div className="absolute inset-x-0 bottom-2 sm:inset-x-auto sm:right-4 sm:bottom-6 z-30 flex flex-row sm:flex-col items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-0 select-none shrink-0 rounded-2xl border border-border/50 bg-background/90 py-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:backdrop-blur-none">
        {/* 1. Like */}
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="size-10 sm:size-12 rounded-full border border-border/40" />
          <Skeleton className="h-2.5 w-5 rounded-full" />
        </div>
        {/* 2. Comment */}
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="size-11 sm:size-12 rounded-full" />
          <Skeleton className="h-2.5 w-5 rounded-full" />
        </div>
        {/* 3. Loop / Repost */}
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="size-11 sm:size-12 rounded-full" />
          <Skeleton className="h-2.5 w-6 rounded-full" />
        </div>
        {/* 4. Bookmark */}
        <Skeleton className="size-11 sm:size-12 rounded-full" />
        {/* 5. Share */}
        <Skeleton className="size-11 sm:size-12 rounded-full" />
        {/* 6. More */}
        <Skeleton className="size-11 sm:size-12 rounded-full" />
      </div>
    </div>
  );
}

// ──────── 6. Profile Skeleton (Twitter / X Header + Feed) ────────

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto w-full select-none border-x border-border/20 min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 py-2.5 flex items-center gap-4">
        <Skeleton className="size-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      </div>

      {/* Banner & Avatar Bar */}
      <div className="relative">
        <Skeleton className="h-36 sm:h-44 w-full rounded-none" />
        <div className="px-4 flex justify-between items-end -mt-12 relative z-10">
          <Skeleton className="size-24 sm:size-28 rounded-full border-4 border-background" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      {/* Bio Info */}
      <div className="px-4 pt-3 pb-4 space-y-3 border-b border-border/30">
        <div className="space-y-1">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-3.5 w-24 rounded-full" />
        </div>

        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-3.5 w-3/4 rounded-md" />
          <Skeleton className="h-3.5 w-1/2 rounded-md" />
        </div>

        <div className="flex items-center gap-4 pt-1">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>

        <div className="flex items-center gap-4 pt-1">
          <Skeleton className="h-3.5 w-20 rounded-full" />
          <Skeleton className="h-3.5 w-20 rounded-full" />
          <Skeleton className="h-3.5 w-20 rounded-full" />
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 border-b border-border/30 text-center py-3 px-2">
        <Skeleton className="h-4 w-12 mx-auto rounded-full" />
        <Skeleton className="h-4 w-12 mx-auto rounded-full" />
        <Skeleton className="h-4 w-16 mx-auto rounded-full" />
        <Skeleton className="h-4 w-14 mx-auto rounded-full" />
      </div>

      {/* Posts Stream */}
      <FeedSkeleton />
    </div>
  );
}

// ──────── 7. Notifications Skeleton (Twitter / X Style) ────────

export function NotificationsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto w-full select-none border-x border-border/20 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 py-3 flex items-center justify-between">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 border-b border-border/30 py-3.5 text-center">
        <Skeleton className="h-4 w-12 mx-auto rounded-full" />
        <Skeleton className="h-4 w-16 mx-auto rounded-full" />
        <Skeleton className="h-4 w-16 mx-auto rounded-full" />
      </div>

      {/* Notification Stream */}
      <div className="divide-y divide-border/25">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex gap-3 px-4 py-3.5">
            <div className="w-7 flex justify-end pt-1">
              <Skeleton className="size-4.5 rounded-full" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-3.5 w-40 rounded-full" />
                <Skeleton className="h-3 w-8 rounded-full ml-auto" />
              </div>
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────── 8. Communities Skeleton ────────

export function CommunitySkeleton() {
  return (
    <div className="divide-y divide-border/25 p-4 select-none">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="size-11 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-36 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-3 w-4/5 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-7 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ──────── 9. Colleges Hub Directory Skeleton ────────

export function CollegesSkeleton() {
  return (
    <div className="max-w-4xl mx-auto w-full p-4 space-y-4 select-none">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44 rounded-xl" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-border/30 bg-muted/10 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-2.5 w-20 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/25">
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────── 10. Dating Deck Skeleton ────────

export function DatingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] p-4 select-none">
      <div className="w-full max-w-sm aspect-3/4 rounded-3xl border border-border/40 bg-card p-5 flex flex-col justify-between shadow-md relative overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full rounded-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <div className="relative z-10 space-y-2 bg-linear-to-t from-black/85 via-black/40 to-transparent -mx-5 -mb-5 p-5">
          <Skeleton className="h-6 w-44 rounded-full bg-white/40" />
          <Skeleton className="h-3.5 w-56 rounded-full bg-white/30" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16 rounded-full bg-white/20" />
            <Skeleton className="h-5 w-16 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 mt-6">
        <Skeleton className="size-13 rounded-full" />
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="size-13 rounded-full" />
      </div>
    </div>
  );
}

// ──────── 11. Chat Skeletons (Responsive & Mobile-Optimized) ────────

export function ChatInboxSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-card select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 sm:p-4 border-b border-border/30 space-y-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        {/* Search */}
        <Skeleton className="h-9 w-full rounded-full" />
        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-0.5">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-18 rounded-full" />
          <Skeleton className="h-6 w-18 rounded-full" />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-2xl border border-border/10 bg-muted/10"
          >
            <div className="relative shrink-0">
              <Skeleton className="size-11 rounded-full" />
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-muted-foreground/30 ring-2 ring-card" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-28 rounded-full" />
                <Skeleton className="h-2.5 w-8 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-44 rounded-full" />
                {i % 2 === 0 && <Skeleton className="size-4 rounded-full" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatThreadSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-background select-none overflow-hidden">
      {/* Sticky Header Skeleton */}
      <div className="border-b border-border/40 bg-card/95 backdrop-blur-md px-3 sm:px-4 py-2.5 pt-[max(0.6rem,env(safe-area-inset-top))] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full sm:hidden" />
          <div className="relative">
            <Skeleton className="size-10 rounded-full" />
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-muted-foreground/30 ring-2 ring-card" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28 sm:w-36 rounded-full" />
            <Skeleton className="h-2.5 w-16 sm:w-20 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full hidden sm:block" />
        </div>
      </div>

      {/* Message Stream Bubbles Skeleton */}
      <div className="flex-1 overflow-hidden px-3 sm:px-6 py-4 space-y-4">
        {/* Incoming */}
        <div className="flex justify-start items-end gap-2">
          <Skeleton className="size-6 rounded-full shrink-0 mb-1" />
          <div className="space-y-1">
            <Skeleton className="h-12 w-56 sm:w-72 rounded-2xl rounded-tl-xs bg-muted/60" />
            <Skeleton className="h-2 w-12 rounded-full ml-1" />
          </div>
        </div>

        {/* Outgoing */}
        <div className="flex justify-end items-end gap-2">
          <div className="space-y-1 flex flex-col items-end">
            <Skeleton className="h-10 w-44 sm:w-60 rounded-2xl rounded-tr-xs bg-primary/25" />
            <Skeleton className="h-2 w-10 rounded-full mr-1" />
          </div>
        </div>

        {/* Incoming with media */}
        <div className="flex justify-start items-end gap-2">
          <Skeleton className="size-6 rounded-full shrink-0 mb-1" />
          <div className="space-y-1">
            <Skeleton className="h-32 sm:h-44 w-52 sm:w-64 rounded-2xl rounded-tl-xs bg-muted/70" />
            <Skeleton className="h-2 w-14 rounded-full ml-1" />
          </div>
        </div>

        {/* Outgoing reply */}
        <div className="flex justify-end items-end gap-2">
          <div className="space-y-1 flex flex-col items-end">
            <Skeleton className="h-16 w-52 sm:w-80 rounded-2xl rounded-tr-xs bg-primary/25" />
            <Skeleton className="h-2 w-12 rounded-full mr-1" />
          </div>
        </div>

        {/* Incoming short */}
        <div className="flex justify-start items-end gap-2">
          <Skeleton className="size-6 rounded-full shrink-0 mb-1" />
          <div className="space-y-1">
            <Skeleton className="h-9 w-32 sm:w-48 rounded-2xl rounded-tl-xs bg-muted/60" />
            <Skeleton className="h-2 w-10 rounded-full ml-1" />
          </div>
        </div>
      </div>

      {/* Bottom Composer Skeleton */}
      <div className="border-t border-border/40 bg-card px-3 sm:px-4 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="size-8 rounded-xl" />
          </div>
          <Skeleton className="h-10 flex-1 rounded-2xl" />
          <Skeleton className="size-10 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex h-full w-full overflow-hidden select-none bg-background">
      {/* On phone: show Inbox skeleton full width. On desktop: show dual pane */}
      <div className="w-full md:w-80 lg:w-96 border-r border-border/30 h-full shrink-0 flex flex-col">
        <ChatInboxSkeleton />
      </div>
      <div className="hidden md:flex flex-1 flex-col h-full">
        <ChatThreadSkeleton />
      </div>
    </div>
  );
}

// ──────── 12. Search Page Skeleton ────────

export function SearchSkeleton() {
  return (
    <div className="max-w-2xl mx-auto w-full select-none border-x border-border/20 min-h-screen">
      {/* Top Search Bar */}
      <div className="p-3 border-b border-border/30">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-4 border-b border-border/30 py-3 text-center">
        <Skeleton className="h-4 w-12 mx-auto rounded-full" />
        <Skeleton className="h-4 w-14 mx-auto rounded-full" />
        <Skeleton className="h-4 w-14 mx-auto rounded-full" />
        <Skeleton className="h-4 w-16 mx-auto rounded-full" />
      </div>

      {/* People Results Preview */}
      <div className="p-4 border-b border-border/30 space-y-3">
        <Skeleton className="h-4 w-28 rounded-full" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-32 rounded-full" />
                  <Skeleton className="h-2.5 w-24 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Posts Stream */}
      <FeedSkeleton />
    </div>
  );
}

// ──────── 13. App Shell Skeleton (Global Page-Transition Fallback) ────────

export function AppShellSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen select-none border-x border-border/20">
      {/* Top Header Placeholder */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border/30 bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>

      {/* Story Rings */}
      <StoryRingSkeleton />

      {/* Feed Stream */}
      <FeedSkeleton />
    </div>
  );
}

// ──────── 14. Academics Hub Skeleton ────────

export function AcademicsSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 space-y-5 select-none pb-24">
      {/* Search & Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Skeleton className="h-10 flex-1 rounded-2xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <Skeleton className="h-8 w-20 rounded-full shrink-0" />
        <Skeleton className="h-8 w-18 rounded-full shrink-0" />
        <Skeleton className="h-8 w-20 rounded-full shrink-0" />
        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
        <Skeleton className="h-8 w-18 rounded-full shrink-0" />
      </div>

      {/* Branch & Semester Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-lg shrink-0" />
        ))}
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card p-4 space-y-3 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="size-9 rounded-xl shrink-0" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-4.5 w-4/5 rounded-md" />
              <Skeleton className="h-3.5 w-full rounded-md" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/20">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────── 15. Hashtag Topic Hub Skeleton ────────

export function HashtagFeedSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen select-none border-x border-border/20 pb-24">
      {/* Hero Topic Card Skeleton */}
      <div className="p-4 sm:p-5 border-b border-border/30 bg-muted/15 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-around border-b border-border/30 py-2.5">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>

      {/* Feed Posts */}
      <FeedSkeleton />
    </div>
  );
}

// ──────── 16. Secret Crush Vault Skeleton ────────

export function SecretCrushSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 space-y-5 select-none pb-24">
      {/* Hero Vault Box */}
      <div className="rounded-3xl border border-border/50 bg-card p-6 text-center space-y-3 shadow-sm">
        <Skeleton className="size-14 mx-auto rounded-2xl" />
        <Skeleton className="h-5 w-40 mx-auto rounded-lg" />
        <Skeleton className="h-3.5 w-60 mx-auto rounded-md" />
      </div>

      {/* Search Input */}
      <Skeleton className="h-11 w-full rounded-2xl" />

      {/* Crush Slots */}
      <div className="space-y-3 pt-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-border/40 bg-card"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>
            <Skeleton className="size-9 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────── 17. Marketplace Skeleton ────────

export function MarketplaceSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 space-y-5 select-none pb-24">
      {/* Category Banners */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="rounded-2xl border border-border/40 bg-card p-3 space-y-2.5">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-12 rounded-md" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
