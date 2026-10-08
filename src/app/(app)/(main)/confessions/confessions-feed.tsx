"use client";

import {
  ArrowLeft,
  Clock,
  Flame,
  Globe,
  Lock,
  Plus,
  RotateCw,
  School,
  Shield,
  Sparkles,
  Trophy,
  VenetianMask,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConfessionComposerInline } from "@/components/confessions/confession-composer-inline";
import { ConfessionEmptyState } from "@/components/confessions/confession-empty-state";
import { ConfessionSidebar } from "@/components/confessions/confession-sidebar";
import { FeedCard } from "@/components/ui/feed-card";
import { ConfessionsFeedSkeleton } from "@/components/ui/skeleton-card";
import { type FeedPost, useFeed } from "@/hooks/use-feed";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const CONFESSION_SORTS = [
  { id: "latest", label: "Latest" },
  { id: "trending", label: "Trending" },
  { id: "top_voted", label: "Top" },
] as const;

const TOPIC_CHIPS = [
  { label: "Hostel Lore", tag: "#HostelLore" },
  { label: "Placement Tea", tag: "#PlacementTea" },
  { label: "Campus Crush", tag: "#CampusCrush" },
  { label: "Exam Vent", tag: "#ExamVent" },
  { label: "Prof Tales", tag: "#ProfTales" },
  { label: "Unfiltered", tag: "#Unfiltered" },
];

export function ConfessionsFeed() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profile } = useProfile();

  // Default scope to GLOBAL so students immediately see a thriving campus stream across India
  const rawScope = searchParams.get("scope");
  const scope: "CAMPUS" | "GLOBAL" = rawScope === "CAMPUS" ? "CAMPUS" : "GLOBAL";

  const rawSort = searchParams.get("sort") || "latest";
  const [currentSort, setCurrentSort] = useState<string>(rawSort);
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [isRotating, setIsRotating] = useState(false);

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
      setRandomSeed((prev) => prev + 1);
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

  function handleReloadRandom() {
    sounds.pop();
    haptics.medium();
    setIsRotating(true);
    setRandomSeed((prev) => prev + 1);
    mutate();
    setTimeout(() => setIsRotating(false), 700);
  }

  function handleConfessionPosted(newPost: FeedPost) {
    setOptimisticPosts((prev) => [newPost, ...prev]);
    mutate();
  }

  const campusShortName =
    profile?.institution?.name?.split(",")[0] || profile?.institution?.name || "Campus";

  return (
    <div className="w-full max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 py-0 sm:py-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ─── Main Confessions Column (8 cols on lg) ─── */}
        <main className="lg:col-span-8 flex flex-col min-h-screen pb-28 sm:pb-12 bg-transparent sm:bg-card/25 sm:rounded-2xl sm:border sm:border-border/30 overflow-hidden shadow-2xs">
          {/* ─── Sticky Controls Bar (Streamlined Header + Single Filter Row) ─── */}
          <div className="sticky top-12 lg:top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/20">
            {/* 1. Sleek Header Row */}
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-border/15 bg-muted/10">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/25 shrink-0">
                  <VenetianMask className="size-3.5" />
                </div>
                <div className="min-w-0 flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-none font-[family-name:var(--font-heading)] truncate">
                    Confessions
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Lock className="size-2.5" />
                    <span>100% Anon</span>
                  </span>
                </div>
              </div>

              {/* Scope Switcher Pill & Quick Action */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center p-0.5 rounded-full bg-muted/50 border border-border/35 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => handleScopeToggle("GLOBAL")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full transition-all cursor-pointer",
                      scope === "GLOBAL"
                        ? "bg-foreground text-background font-bold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Pan-India All Colleges"
                  >
                    All India
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScopeToggle("CAMPUS")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full transition-all cursor-pointer max-w-[80px] sm:max-w-[120px] truncate",
                      scope === "CAMPUS"
                        ? "bg-foreground text-background font-bold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={`Campus Hub: ${campusShortName}`}
                  >
                    {campusShortName}
                  </button>
                </div>

                {/* Direct Whisper Action */}
                <Link
                  href="/post/new?type=CONFESSION"
                  className="inline-flex h-7 px-2.5 items-center gap-1 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                  title="Whisper an anonymous confession"
                >
                  <Plus className="size-3" />
                  <span>Whisper</span>
                </Link>
              </div>
            </div>

            {/* 2. Unified Filter Strip: Sorts + Topics in a single horizontal scroll row */}
            <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 overflow-x-auto no-scrollbar bg-card/20 select-none">
              {CONFESSION_SORTS.map((s) => {
                const isActive = currentSort === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSortChange(s.id)}
                    className={cn(
                      "h-7 px-3 rounded-full text-xs transition-all cursor-pointer select-none shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}

              <div className="h-3.5 w-px bg-border/40 shrink-0 mx-0.5" />

              {/* Active Topic Filter Chip with Clear Button */}
              {activeTag && (
                <button
                  type="button"
                  onClick={() => handleTagSelect("")}
                  className="h-7 px-2.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <span>{activeTag}</span>
                  <span className="text-xs font-bold">×</span>
                </button>
              )}

              {/* Topic Chips */}
              {TOPIC_CHIPS.map((chip) => {
                if (activeTag === chip.tag) return null;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleTagSelect(chip.tag)}
                    className="h-7 px-2.5 rounded-full text-[11px] font-medium bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/25 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Mobile Prompt Bar & Desktop Inline Composer */}
          <div className="sm:hidden px-3 py-2 border-b border-border/15 bg-muted/10">
            <Link
              href="/post/new?type=CONFESSION"
              className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-card border border-border/50 hover:border-primary/40 text-muted-foreground transition-all shadow-2xs active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <VenetianMask className="size-3.5 text-purple-400 shrink-0" />
                <span className="text-xs truncate">
                  Spill an anonymous confession...
                </span>
              </div>
              <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 shrink-0">
                <Lock className="size-2.5" />
                Anon
              </span>
            </Link>
          </div>

          <div className="hidden sm:block p-3 sm:p-4 border-b border-border/15 bg-card/10">
            <ConfessionComposerInline
              scope={scope}
              campusName={campusShortName}
              onConfessionPosted={handleConfessionPosted}
            />
          </div>

          {/* ─── 3. Confessions Feed Stream ─── */}
          <div className="flex flex-col">
            {isLoading && uniqueFeed.length === 0 ? (
              <ConfessionsFeedSkeleton />
            ) : uniqueFeed.length > 0 ? (
              <>
                {uniqueFeed.map((post) => (
                  <FeedCard key={post.id} post={post} />
                ))}

                {/* Infinite Scroll Trigger */}
                <div
                  ref={setLoadMoreNode}
                  className="flex flex-col items-center justify-center gap-2 py-8 text-xs text-muted-foreground select-none"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Whispering more secrets...</span>
                    </div>
                  ) : !isReachingEnd ? (
                    <button
                      type="button"
                      onClick={() => setSize((s) => s + 1)}
                      className="h-8 rounded-full bg-muted/60 px-4 text-xs font-bold text-foreground shadow-2xs hover:bg-muted transition-colors cursor-pointer"
                    >
                      Load more whispers
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 font-medium">
                      <Sparkles className="size-3 text-purple-400/60" />
                      <span>You&apos;ve caught up with all campus secrets</span>
                    </div>
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

        {/* ─── Desktop Context & Rules Rail (4 cols on lg, sticky) ─── */}
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
