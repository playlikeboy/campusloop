"use client";

import {
  ArrowLeft,
  Clock,
  Flame,
  Globe,
  RotateCw,
  School,
  Trophy,
  VenetianMask,
  Zap,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FeedCard } from "@/components/ui/feed-card";
import { ConfessionsFeedSkeleton } from "@/components/ui/skeleton-card";
import { useFeed } from "@/hooks/use-feed";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const CONFESSION_TABS = [
  { id: "for_you", label: "For you", icon: Flame, colorClass: "text-primary" },
  { id: "trending", label: "Trending", icon: Flame, colorClass: "text-orange-500" },
  { id: "viral", label: "Viral", icon: Zap, colorClass: "text-emerald-500" },
  { id: "latest", label: "Latest", icon: Clock, colorClass: "text-sky-500" },
  { id: "most_discussed", label: "Discussed", icon: Trophy, colorClass: "text-violet-500" },
  { id: "top_voted", label: "Top", icon: Trophy, colorClass: "text-yellow-500" },
  { id: "spicy", label: "Spicy", icon: Flame, colorClass: "text-amber-500" },
  { id: "random", label: "Random", icon: Zap, colorClass: "text-purple-500" },
] as const;

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

  const { feed, isLoading, isLoadingMore, isReachingEnd, setSize, mutate, refresh } = useFeed(
    scope,
    "CONFESSION",
    currentSort,
    "all",
    undefined,
    randomSeed
  );

  // De-duplicate items safely
  const uniqueFeed = useMemo(() => {
    if (!feed) return [];
    const map = new Map<string, (typeof feed)[0]>();
    for (const post of feed) {
      if (!map.has(post.id)) {
        map.set(post.id, post);
      }
    }
    return Array.from(map.values());
  }, [feed]);

  const [loadMoreNode, setLoadMoreNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreNode || isReachingEnd || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
          setSize((s) => s + 1);
        }
      },
      { threshold: 0, rootMargin: "700px 0px" }
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

  function handleReloadRandom() {
    sounds.pop();
    haptics.medium();
    setIsRotating(true);
    setRandomSeed((prev) => prev + 1);
    mutate();
    setTimeout(() => setIsRotating(false), 700);
  }

  const campusShortName = profile?.institution?.name?.split(",")[0] || profile?.institution?.name || "Campus";

  return (
      <main className="mx-auto flex w-full max-w-2xl flex-col min-h-screen select-none pb-[calc(4.25rem+env(safe-area-inset-bottom))] bg-background">
        {/* ─── Compact Confessions Header ─── */}
        <header className="sticky top-0 z-40 border-b border-border/25 bg-background/90 backdrop-blur-xl">
          <div className="flex min-h-12 items-center justify-between gap-2 px-3.5 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
                title="Go back"
                aria-label="Go back"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <VenetianMask className="size-4 text-purple-500 shrink-0" />
                  <h1 className="truncate text-sm font-black tracking-tight text-foreground">Confessions</h1>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {scope === "CAMPUS" ? (
                    <>
                      <School className="size-3 text-primary shrink-0" />
                      <span className="truncate max-w-[135px]">{campusShortName}</span>
                    </>
                  ) : (
                    <>
                      <Globe className="size-3 text-primary shrink-0" />
                      <span>All India</span>
                    </>
                  )}
                  <span className="text-muted-foreground/40">·</span>
                  <button
                    type="button"
                    onClick={() => handleScopeToggle(scope === "CAMPUS" ? "GLOBAL" : "CAMPUS")}
                    className="font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Switch confession scope"
                  >
                    Switch
                  </button>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                href="/post/new?type=CONFESSION"
                prefetch
                onClick={() => {
                  sounds.tap();
                  haptics.medium();
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[11px] font-black text-primary-foreground shadow-sm shadow-primary/15 transition-transform hover:opacity-95 active:scale-95"
              >
                <VenetianMask className="size-3.5" />
                <span>Confess</span>
              </Link>
              <button
                type="button"
                onClick={handleReloadRandom}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
                title="Refresh feed"
                aria-label="Refresh feed"
              >
                <RotateCw className={cn("size-3.5 transition-transform duration-700", isRotating && "animate-spin")} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border/15 px-3.5">
            <div className="overflow-x-auto scrollbar-none">
              <div className="flex min-w-max items-center gap-1">
                {CONFESSION_TABS.map((tab) => {
                  const isActive = currentSort === tab.id;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSortChange(tab.id)}
                      className={cn(
                        "relative flex min-h-10 items-center gap-1.5 px-3 text-[11px] font-bold transition-colors cursor-pointer",
                        isActive ? "text-foreground font-black" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <TabIcon className={cn("size-3.5", isActive ? tab.colorClass : "text-muted-foreground")} />
                      <span>{tab.label}</span>
                      {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="hidden shrink-0 px-1 text-[10px] font-medium text-muted-foreground sm:inline">
              Pull to refresh
            </span>
          </div>
        </header>

        {/* ─── Feed Stream Starts Directly Here (Zero Chrome Clutter) ─── */}
        <div className="flex flex-col">
          {isLoading ? (
            <ConfessionsFeedSkeleton />
          ) : uniqueFeed.length > 0 ? (
            <>
              {uniqueFeed.map((post) => (
                <FeedCard key={post.id} post={post} />
              ))}

              {/* Infinite Scroll Trigger */}
              <div
                ref={setLoadMoreNode}
                className="flex flex-col items-center justify-center gap-2 py-6 text-xs text-muted-foreground"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Loading more confessions...</span>
                  </div>
                ) : !isReachingEnd ? (
                  <button
                    type="button"
                    onClick={() => setSize((s) => s + 1)}
                    className="h-9 rounded-full bg-muted/60 px-4 text-[11px] font-bold text-foreground shadow-xs transition-colors hover:bg-muted cursor-pointer"
                  >
                    Load more
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground/60 font-medium">
                    You&apos;ve caught up with all campus secrets
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center px-4 space-y-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/25 mx-auto">
                <VenetianMask className="size-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">No confessions found here yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Be the first to spill campus secrets or publish an anonymous long-form story.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/post/new?type=CONFESSION"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Spill First Confession
                </Link>
              </div>
            </div>
          )}
        </div>

      </main>
  );
}
