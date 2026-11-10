"use client";

import { Loader2, Lock, Plus, VenetianMask } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConfessionComposerInline } from "@/components/confessions/confession-composer-inline";
import { ConfessionEmptyState } from "@/components/confessions/confession-empty-state";
import { ConfessionSidebar } from "@/components/confessions/confession-sidebar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FeedCard } from "@/components/ui/feed-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ConfessionsFeedSkeleton } from "@/components/ui/skeleton-card";
import { type FeedPost, useFeed } from "@/hooks/use-feed";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

const CONFESSION_SORTS = [
  { id: "latest", label: "Latest" },
  { id: "trending", label: "Trending" },
  { id: "top_voted", label: "Top" },
] as const;

const TOPIC_CHIPS = [
  { label: "Hostel", tag: "#HostelLore" },
  { label: "Placements", tag: "#PlacementTea" },
  { label: "Crush", tag: "#CampusCrush" },
  { label: "Exams", tag: "#ExamVent" },
  { label: "Profs", tag: "#ProfTales" },
];

export function ConfessionsFeed() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profile } = useProfile();

  // Default to all colleges so a new campus never opens on an empty page.
  const rawScope = searchParams.get("scope");
  const scope: "CAMPUS" | "GLOBAL" = rawScope === "CAMPUS" ? "CAMPUS" : "GLOBAL";

  const rawSort = searchParams.get("sort") || "latest";
  const [currentSort, setCurrentSort] = useState<string>(rawSort);
  const [randomSeed, setRandomSeed] = useState<number>(0);

  // Keep the selected sort in sync with browser back/forward navigation.
  useEffect(() => {
    setCurrentSort(rawSort);
  }, [rawSort]);

  // Active hashtag filter
  const activeTag = searchParams.get("tag") || "";
  const [optimisticPosts, setOptimisticPosts] = useState<FeedPost[]>([]);

  const { feed, isLoading, isLoadingMore, isReachingEnd, setSize, mutate } = useFeed(
    scope,
    "CONFESSION",
    currentSort,
    "all",
    activeTag || undefined,
    randomSeed
  );

  // De-duplicate items safely and combine with optimistic posts
  const uniqueFeed = useMemo(() => {
    const map = new Map<string, FeedPost>();

    // Prepend optimistic posts that haven't landed in SWR feed yet
    for (const post of optimisticPosts) {
      if (post?.id) map.set(post.id, post);
    }

    if (feed) {
      for (const post of feed) {
        if (post?.id) {
          map.set(post.id, post);
        }
      }
    }

    return Array.from(map.values());
  }, [feed, optimisticPosts]);

  const [loadMoreNode, setLoadMoreNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreNode || isReachingEnd || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
          setSize((s) => s + 1);
        }
      },
      { threshold: 0.05, rootMargin: "600px 0px" }
    );

    observer.observe(loadMoreNode);
    return () => observer.disconnect();
  }, [loadMoreNode, isReachingEnd, isLoadingMore, setSize]);

  function handleScopeToggle(newScope: "CAMPUS" | "GLOBAL") {
    sounds.tap();
    haptics.light();
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", newScope);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSortChange(sortId: string) {
    sounds.tap();
    haptics.light();
    setCurrentSort(sortId);
    if (sortId === "random") {
      setRandomSeed((prev: number) => prev + 1);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleTagSelect(tag: string) {
    sounds.tap();
    haptics.light();
    const params = new URLSearchParams(searchParams.toString());
    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleConfessionPosted(newPost: FeedPost) {
    setOptimisticPosts((prev) => [newPost, ...prev]);
    mutate();
  }

  const campusShortName = profile?.institution?.name?.split(",")[0] || profile?.institution?.name || "Campus";

  return (
    <div className="w-full max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 sm:pb-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <main className="lg:col-span-8 flex flex-col min-h-screen pb-28 sm:pb-12 sm:rounded-lg sm:border sm:border-border bg-bg overflow-hidden">
          <div className="sticky top-12 lg:top-0 z-30 bg-bg border-b border-border">
            <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-xl">
                  <VenetianMask className="size-5 text-fg-muted" aria-hidden />
                  Confessions
                </h1>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-muted">
                  <Lock className="size-3" aria-hidden />
                  Your name is never shown here.
                </p>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link href="/post/new?type=CONFESSION">
                  <Plus className="size-4" aria-hidden />
                  Confess
                </Link>
              </Button>
            </div>

            <div className="px-4 pb-2">
              <SegmentedControl
                size="sm"
                fullWidth
                value={scope}
                onChange={handleScopeToggle}
                options={[
                  { value: "GLOBAL", label: "All colleges" },
                  { value: "CAMPUS", label: campusShortName },
                ]}
              />
            </div>

            <div className="flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto no-scrollbar select-none">
              {CONFESSION_SORTS.map((item) => (
                <Chip
                  key={item.id}
                  size="sm"
                  selected={currentSort === item.id}
                  onClick={() => handleSortChange(item.id)}
                >
                  {item.label}
                </Chip>
              ))}
              <span className="h-4 w-px bg-border shrink-0 mx-1" aria-hidden />
              {activeTag && (
                <Chip
                  size="sm"
                  selected
                  onClick={() => handleTagSelect("")}
                  onRemove={() => handleTagSelect("")}
                >
                  {activeTag}
                </Chip>
              )}
              {TOPIC_CHIPS.filter((chip) => chip.tag !== activeTag).map((chip) => (
                <Chip key={chip.label} size="sm" onClick={() => handleTagSelect(chip.tag)}>
                  {chip.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="sm:hidden px-4 py-3 border-b border-border">
            <Link
              href="/post/new?type=CONFESSION"
              className="flex min-h-11 items-center gap-2 rounded-md bg-surface-muted px-3.5 text-sm text-fg-subtle transition-ui hover:bg-surface-sunken"
            >
              <VenetianMask className="size-4 text-fg-muted shrink-0" aria-hidden />
              <span className="truncate">Write something anonymously…</span>
            </Link>
          </div>

          <div className="hidden sm:block p-4 border-b border-border">
            <ConfessionComposerInline
              scope={scope}
              campusName={campusShortName}
              onConfessionPosted={handleConfessionPosted}
            />
          </div>

          <div className="flex flex-col">
            {isLoading && uniqueFeed.length === 0 ? (
              <ConfessionsFeedSkeleton />
            ) : uniqueFeed.length > 0 ? (
              <>
                {uniqueFeed.map((post) => (
                  <FeedCard key={post.id} post={post} />
                ))}

                <div
                  ref={setLoadMoreNode}
                  className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-fg-muted select-none"
                >
                  {isLoadingMore ? (
                    <span className="flex items-center gap-2" role="status">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Loading more…
                    </span>
                  ) : !isReachingEnd ? (
                    <Button variant="secondary" size="sm" onClick={() => setSize((n) => n + 1)}>
                      Load more
                    </Button>
                  ) : (
                    <span>You&apos;re all caught up</span>
                  )}
                </div>
              </>
            ) : (
              <ConfessionEmptyState
                scope={scope}
                campusName={campusShortName}
                activeTag={activeTag}
                onOpenComposer={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onResetFilter={() => {
                  handleTagSelect("");
                }}
              />
            )}
          </div>
        </main>

        <div className="hidden lg:block lg:col-span-4 sticky top-20">
          <ConfessionSidebar
            scope={scope}
            onScopeChange={handleScopeToggle}
            campusName={campusShortName}
            activeTag={activeTag}
            onTagSelect={handleTagSelect}
          />
        </div>
      </div>
    </div>
  );
}
