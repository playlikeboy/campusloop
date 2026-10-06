"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FastCommentsModal } from "@/components/feed/fast-comments-modal";
import { DeckAcademicDropCard } from "@/components/post/deck/deck-academic-drop-card";
import type { LoopDeckItem } from "@/components/post/deck/deck-types";
import { DeckUserSuggestionsCard } from "@/components/post/deck/deck-user-suggestions-card";
import { PostReelCard } from "@/components/post/post-reel-card";
import type { FeedPost } from "@/hooks/use-feed";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface PostReelsDeckProps {
  initialItems: LoopDeckItem[];
  currentUserId?: string;
  campusName?: string;
}

export function PostReelsDeck({ initialItems, currentUserId, campusName }: PostReelsDeckProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<LoopDeckItem[]>(initialItems);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const hasUserInteractedRef = useRef(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<FeedPost | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("for_you");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const isProgrammaticScrollRef = useRef(false);
  const isWheelingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  // Keep state firmly anchored at the requested post when initialItems changes
  const initialPostId = initialItems[0]?.type === "POST" ? initialItems[0].post.id : "";
  useEffect(() => {
    setItems(initialItems);
    setActiveIndex(0);
    activeIndexRef.current = 0;
    hasUserInteractedRef.current = false;
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [initialPostId]);

  // Ensure scroll is at 0 on initial mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);
  // Smooth scroll to target index (for keyboard or navigation)
  const scrollToIndex = useCallback(
    (index: number) => {
      if (!containerRef.current || index < 0 || index >= items.length) return;
      hasUserInteractedRef.current = true;
      sounds.tap();
      haptics.light();
      isProgrammaticScrollRef.current = true;
      const targetElement = containerRef.current.children[index] as HTMLElement;
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      activeIndexRef.current = index;
      setActiveIndex(index);

      const currentItem = items[index];
      if (currentItem && currentItem.type === "POST") {
        const currentPost = currentItem.post;
        const targetUrl = `/post/${currentPost.id}`;
        if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
          window.history.replaceState(null, "", targetUrl);
        }
        const author = currentPost.isAnonymous
          ? "Anonymous Student"
          : currentPost.author?.displayName || "Student";
        document.title = `${author}'s Loop | CampusLoop`;
      }

      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 450);
    },
    [items]
  );

  // Helper to construct query URL based on active tab
  const getFeedUrl = useCallback((tab: string, pageNum: number) => {
    let sortParam = "for_you";
    let typeParam = "";
    let hashtagParam = "";

    if (tab === "latest") {
      sortParam = "latest";
    } else if (tab === "clubs") {
      sortParam = "trending";
      typeParam = "COMMUNITY";
    } else if (tab === "opportunities") {
      sortParam = "latest";
      hashtagParam = "opportunities";
    }

    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    params.set("limit", "15");
    params.set("sort", sortParam);
    params.set("scope", "GLOBAL");
    if (typeParam) params.set("type", typeParam);
    if (hashtagParam) params.set("hashtag", hashtagParam);

    return `/api/feed?${params.toString()}`;
  }, []);

  // Load more posts when near bottom of deck - Truly infinite scroll with feed algorithm
  const loadMorePosts = useCallback(
    async () => {
      if (isLoadingMore) return;
      setIsLoadingMore(true);
      try {
        const nextPage = page + 1;
        const url = getFeedUrl(activeTab, nextPage);
        const data = await fetcher<FeedPost[] | { posts: FeedPost[] }>(url);
        const rawPosts: FeedPost[] = Array.isArray(data) ? data : data?.posts || [];

        if (rawPosts.length > 0) {
          setItems((prev) => {
            const existingPostIds = new Set(
              prev.filter((i) => i.type === "POST").map((i) => (i as { post: FeedPost }).post.id)
            );
            const freshPosts = rawPosts.filter((p) => !existingPostIds.has(p.id));
            if (freshPosts.length === 0) return prev;
            const newItems: LoopDeckItem[] = freshPosts.map((p) => ({ type: "POST", post: p }));
            return [...prev, ...newItems];
          });
          setPage(nextPage);
        } else {
          // Fallback: If page runs dry, cycle in trending/viral campus posts so scroll never ends
          const fallbackData = await fetcher<FeedPost[] | { posts: FeedPost[] }>(
            `/api/feed?page=1&limit=20&sort=trending&scope=GLOBAL`
          );
          const fallbackPosts: FeedPost[] = Array.isArray(fallbackData)
            ? fallbackData
            : fallbackData?.posts || [];
          if (fallbackPosts.length > 0) {
            setItems((prev) => {
              const existingPostIds = new Set(
                prev.filter((i) => i.type === "POST").map((i) => (i as { post: FeedPost }).post.id)
              );
              const freshPosts = fallbackPosts.filter((p) => !existingPostIds.has(p.id));
              if (freshPosts.length === 0) return prev;
              return [...prev, ...freshPosts.map((p) => ({ type: "POST", post: p }) as LoopDeckItem)];
            });
          }
        }
      } catch {
        // Ignore network error
      } finally {
        setIsLoadingMore(false);
      }
    },
    [isLoadingMore, page, activeTab, getFeedUrl]
  );

  // Pre-fetch next posts on mount so user always has immediate continuity
  useEffect(() => {
    if (items.length <= 2) {
      loadMorePosts();
    }
  }, [items.length, loadMorePosts]);

  // Tab change handler with instant refresh & smooth reset to top
  const handleTabChange = useCallback(
    async (tabId: string) => {
      setActiveTab(tabId);
      hasUserInteractedRef.current = true;
      sounds.tap();
      haptics.light();
      try {
        const url = getFeedUrl(tabId, 1);
        const data = await fetcher<FeedPost[] | { posts: FeedPost[] }>(url);
        const rawPosts: FeedPost[] = Array.isArray(data) ? data : data?.posts || [];

        if (rawPosts.length > 0) {
          const newItems: LoopDeckItem[] = rawPosts.map((p) => ({ type: "POST", post: p }));
          setItems(newItems);
          setActiveIndex(0);
          activeIndexRef.current = 0;
          setPage(1);
          if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
          }
          if (newItems[0]?.type === "POST") {
            const targetUrl = `/post/${newItems[0].post.id}`;
            if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
              window.history.replaceState(null, "", targetUrl);
            }
          }
        } else {
          // Fallback to general feed if tab-specific filter yields no results
          const fallback = await fetcher<FeedPost[] | { posts: FeedPost[] }>(
            `/api/feed?page=1&limit=15&sort=latest&scope=GLOBAL`
          );
          const fbPosts: FeedPost[] = Array.isArray(fallback) ? fallback : fallback?.posts || [];
          if (fbPosts.length > 0) {
            const newItems: LoopDeckItem[] = fbPosts.map((p) => ({ type: "POST", post: p }));
            setItems(newItems);
            setActiveIndex(0);
            activeIndexRef.current = 0;
            setPage(1);
            if (containerRef.current) {
              containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
            }
            if (newItems[0]?.type === "POST") {
              const targetUrl = `/post/${newItems[0].post.id}`;
              if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
                window.history.replaceState(null, "", targetUrl);
              }
            }
          }
        }
      } catch {
        // ignore
      }
    },
    [getFeedUrl]
  );

  // Keyboard navigation (ArrowDown, ArrowUp, J, K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectedPostForComments) return;
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "ArrowDown" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        hasUserInteractedRef.current = true;
        scrollToIndex(activeIndexRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        hasUserInteractedRef.current = true;
        scrollToIndex(activeIndexRef.current - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scrollToIndex, selectedPostForComments]);

  // Sentinel ref for infinite scroll prefetching
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMorePosts, isLoadingMore]);

  // IntersectionObserver to sync URL when a post is visible without hijacking scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!hasUserInteractedRef.current || isProgrammaticScrollRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const indexAttr = entry.target.getAttribute("data-index");
            if (indexAttr !== null) {
              const newIdx = Number.parseInt(indexAttr, 10);
              if (newIdx >= 0 && newIdx < items.length && newIdx !== activeIndexRef.current) {
                activeIndexRef.current = newIdx;
                setActiveIndex(newIdx);

                const currentItem = items[newIdx];
                if (currentItem && currentItem.type === "POST") {
                  const currentPost = currentItem.post;
                  const targetUrl = `/post/${currentPost.id}`;
                  if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
                    window.history.replaceState(null, "", targetUrl);
                  }
                  const author = currentPost.isAnonymous
                    ? "Anonymous Student"
                    : currentPost.author?.displayName || "Student";
                  document.title = `${author}'s Loop | CampusLoop`;
                }
              }
            }
          }
        }
      },
      { root: container, threshold: 0.5 }
    );

    const elements = container.querySelectorAll("[data-index]");
    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col bg-background">
      {/* ─── Ambient Glow in Background ─── */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] bg-purple-600/10 blur-[140px] rounded-full -z-10" />

      {/* ─── Top Header & Subheader Tabs ─── */}
      <header className="sticky top-0 shrink-0 z-30 px-3 sm:px-4 py-2 bg-background/90 backdrop-blur-xl border-b border-border/20 transition-all">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/feeds"
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
              title="Back to Feeds"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>

            <div className="h-3.5 w-px bg-border/40 shrink-0" />

            {/* Discovery Tabs */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: "for_you", label: "For You" },
                { id: "latest", label: "Latest" },
                { id: "clubs", label: "Communities" },
                { id: "opportunities", label: "Opportunities" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative pb-1 transition-colors cursor-pointer whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 inset-x-0 h-[2px] rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Continuous Native Scroll Feed Container ─── */}
      <div
        ref={containerRef}
        onScroll={() => {
          hasUserInteractedRef.current = true;
        }}
        className="flex-1 w-full min-h-0 overflow-y-auto overscroll-y-contain scroll-smooth no-scrollbar pb-28 sm:pb-16 divide-y divide-border/15"
      >
        {items.map((item, index) => (
          <div
            key={item.type === "POST" ? item.post.id : item.id}
            data-index={index}
            className="w-full relative flex flex-col bg-background/50 hover:bg-muted/[0.03] transition-colors"
          >
            {item.type === "POST" ? (
              <PostReelCard
                post={item.post}
                currentUserId={currentUserId}
                onOpenComments={(p) => setSelectedPostForComments(p)}
                isActive={index === activeIndex}
              />
            ) : item.type === "USER_SUGGESTIONS" ? (
              <div className="max-w-2xl mx-auto w-full px-4 py-3 sm:px-6">
                <DeckUserSuggestionsCard users={item.users} institutionName={campusName} />
              </div>
            ) : item.type === "ACADEMIC_DROP" ? (
              <div className="max-w-2xl mx-auto w-full px-4 py-3 sm:px-6">
                <DeckAcademicDropCard resource={item.resource} />
              </div>
            ) : item.type === "POLL_SPOTLIGHT" ? (
              <PostReelCard
                post={item.post}
                currentUserId={currentUserId}
                onOpenComments={(p) => setSelectedPostForComments(p)}
                isActive={index === activeIndex}
              />
            ) : null}
          </div>
        ))}

        {/* Infinite Scroll Trigger Sentinel */}
        <div ref={sentinelRef} className="w-full py-8 flex items-center justify-center select-none">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span className="size-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span>Loading more campus moments...</span>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground/50 font-medium">
              Scroll for more
            </div>
          )}
        </div>
      </div>

      {/* ─── Slide-Up Comments Drawer ─── */}
      {selectedPostForComments && (
        <FastCommentsModal
          post={selectedPostForComments}
          isOpen={Boolean(selectedPostForComments)}
          onClose={() => setSelectedPostForComments(null)}
          onCommentCountChange={(newCount) => {
            setItems((prev) =>
              prev.map((i) =>
                i.type === "POST" && i.post.id === selectedPostForComments.id
                  ? { ...i, post: { ...i.post, commentsCount: newCount } }
                  : i
              )
            );
          }}
        />
      )}
    </div>
  );
}
