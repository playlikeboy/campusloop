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

const CONFESSION_TABS = [
  { id: "latest", label: "Latest", icon: Clock, colorClass: "text-sky-400" },
  { id: "trending", label: "Trending", icon: Flame, colorClass: "text-orange-500" },
  { id: "top_voted", label: "Top", icon: Trophy, colorClass: "text-yellow-500" },
  { id: "spicy", label: "Spicy", icon: Sparkles, colorClass: "text-amber-400" },
  { id: "random", label: "Shuffle", icon: Zap, colorClass: "text-purple-400" },
] as const;

const TOPIC_CHIPS = [
  { label: "All Whispers", tag: "" },
  { label: "#HostelLore", tag: "#HostelLore" },
  { label: "#PlacementTea", tag: "#PlacementTea" },
  { label: "#CampusCrush", tag: "#CampusCrush" },
  { label: "#ExamVent", tag: "#ExamVent" },
  { label: "#ProfTales", tag: "#ProfTales" },
  { label: "#Unfiltered", tag: "#Unfiltered" },
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
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Main Confessions Column (8 cols on lg) ─── */}
        <main className="lg:col-span-8 flex flex-col min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] bg-card/25 rounded-2xl border border-border/25 overflow-hidden shadow-2xs">
          {/* ─── 1. Atmospheric Whisper Sanctuary Header ─── */}
          <header className="sticky top-0 md:top-14 z-30 border-b border-border/25 bg-background/90 backdrop-blur-xl shadow-2xs">
            <div className="flex min-h-12 items-center justify-between gap-2 px-3 sm:px-4 py-1.5">
              {/* Back Button & Title */}
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']"
                  title="Go back"
                  aria-label="Go back"
                >
                  <ArrowLeft className="size-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="flex size-5 items-center justify-center rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/35">
                      <VenetianMask className="size-3.5" />
                    </div>
                    <h1 className="truncate text-sm sm:text-base font-black tracking-tight text-foreground">
                      Campus Confessions
                    </h1>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <Lock className="size-2.5 text-emerald-400 shrink-0" />
                    <span>Identity Sealed</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>Zero Trace</span>
                  </div>
                </div>
              </div>

              {/* Scope Switcher Pill & Actions */}
              <div className="flex shrink-0 items-center gap-1.5">
                {/* Compact Header Scope Switcher */}
                <div className="flex items-center p-0.5 rounded-full bg-muted/50 border border-border/40 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => handleScopeToggle("GLOBAL")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer relative before:absolute before:-inset-1 before:content-['']",
                      scope === "GLOBAL"
                        ? "bg-foreground text-background shadow-2xs font-black"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Pan-India All Colleges"
                  >
                    <Globe className="size-2.5" />
                    <span className="hidden sm:inline">All India</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScopeToggle("CAMPUS")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer max-w-[100px] sm:max-w-[130px] truncate relative before:absolute before:-inset-1 before:content-['']",
                      scope === "CAMPUS"
                        ? "bg-foreground text-background shadow-2xs font-black"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={`Campus Hub: ${campusShortName}`}
                  >
                    <School className="size-2.5 shrink-0" />
                    <span className="truncate">{campusShortName}</span>
                  </button>
                </div>

                {/* Random Shuffle Refresh Trigger */}
                <button
                  type="button"
                  onClick={handleReloadRandom}
                  className="flex size-8 sm:size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']"
                  title="Shuffle random confessions"
                  aria-label="Shuffle random confessions"
                >
                  <RotateCw
                    className={cn("size-3.5 transition-transform duration-700", isRotating && "animate-spin")}
                  />
                </button>

                {/* Dedicated Full Page Confession Link */}
                <Link
                  href="/post/new?type=CONFESSION"
                  className="hidden sm:inline-flex size-9 items-center justify-center rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 active:scale-95 transition-all cursor-pointer"
                  title="Open dedicated editor"
                  aria-label="Open dedicated editor"
                >
                  <Plus className="size-4" />
                </Link>
              </div>
            </div>

            {/* ─── Primary Sort Tabs Bar ─── */}
            <div className="flex items-center justify-between border-t border-border/15 px-3">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {CONFESSION_TABS.map((tab) => {
                  const isActive = currentSort === tab.id;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSortChange(tab.id)}
                      className={cn(
                        "relative flex min-h-9 items-center gap-1.5 px-3 text-xs font-bold transition-colors cursor-pointer select-none shrink-0 relative before:absolute before:-inset-1 before:content-['']",
                        isActive ? "text-foreground font-black" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <TabIcon
                        className={cn("size-3.5", isActive ? tab.colorClass : "text-muted-foreground")}
                      />
                      <span>{tab.label}</span>
                      {isActive && (
                        <span className="absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              {activeTag && (
                <button
                  type="button"
                  onClick={() => handleTagSelect("")}
                  className="text-[10px] font-bold text-purple-400 hover:underline shrink-0 pr-1 cursor-pointer"
                >
                  Clear Tag ({activeTag})
                </button>
              )}
            </div>

            {/* ─── Topic Hashtag Chips Bar ─── */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto no-scrollbar border-t border-border/10 bg-card/10">
              {TOPIC_CHIPS.map((chip) => {
                const isSelected = activeTag === chip.tag;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleTagSelect(chip.tag)}
                    className={cn(
                      "h-6 px-2.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border select-none shrink-0",
                      isSelected
                        ? "bg-purple-500 text-white border-purple-400 shadow-2xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/30"
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </header>

          {/* ─── 2. Fast Inline Anonymous Whisper Composer ─── */}
          <div className="p-3 sm:p-4 border-b border-border/20 bg-card/15">
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

      {/* ─── Mobile Floating Whisper FAB ─── */}
      <button
        type="button"
        onClick={() => {
          sounds.pop();
          haptics.medium();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="sm:hidden fixed bottom-20 right-4 z-40 flex items-center gap-1.5 h-11 px-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50 text-xs font-black transition-all active:scale-95 cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']"
        aria-label="Whisper anonymous secret"
      >
        <VenetianMask className="size-4" />
        <span>Whisper</span>
      </button>
    </div>
  );
}
