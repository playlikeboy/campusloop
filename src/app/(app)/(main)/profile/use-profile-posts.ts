"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeedPost } from "@/hooks/use-feed";

const PAGE_SIZE = 20;

/** Infinite scroll for a profile's posts. Viewer mode shows only the first 5. */
export function useProfilePosts(
  profileId: string,
  initialPosts: FeedPost[],
  { capped, enabled }: { capped: boolean; enabled: boolean }
) {
  const [posts, setPosts] = useState<FeedPost[]>(capped ? initialPosts.slice(0, 5) : initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(!capped && initialPosts.length >= PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setPosts(capped ? initialPosts.slice(0, 5) : initialPosts);
    setHasMore(!capped && initialPosts.length >= PAGE_SIZE);
    setPage(1);
    setLoadMoreError(false);
  }, [initialPosts, capped]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/feed?authorId=${profileId}&page=${nextPage}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("Failed to load more posts");
      const newPosts = (await res.json()) as FeedPost[];
      setLoadMoreError(false);
      if (newPosts.length < PAGE_SIZE) setHasMore(false);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...newPosts.filter((p) => !seen.has(p.id))];
      });
      setPage(nextPage);
    } catch {
      // Keep pagination enabled so a transient network failure can be retried.
      setLoadMoreError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, profileId]);

  useEffect(() => {
    if (!sentinel || !hasMore || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !loadMoreError) void loadMore();
      },
      { threshold: 0.2, rootMargin: "250px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasMore, isLoadingMore, loadMoreError, loadMore, enabled]);

  return {
    posts,
    hasMore,
    isLoadingMore,
    loadMoreError,
    setSentinel,
    retry: () => {
      setLoadMoreError(false);
      void loadMore();
    },
  };
}
