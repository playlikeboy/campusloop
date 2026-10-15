"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Measures how long each feed post is actually on screen (>= 50% visible) and
 * ships batches to /api/feed/impressions. The ranker uses this to learn what a
 * viewer scrolls straight past, which upvotes and replies alone can't tell it.
 *
 * Usage: `const trackRef = useFeedImpressions(enabled)` then
 * `<div ref={trackRef} data-feed-post-id={post.id}>`.
 */

const ENDPOINT = "/api/feed/impressions";
const FLUSH_INTERVAL_MS = 15_000;
const MAX_BATCH = 30;
/** Shorter than this counts as a glance, not an impression. */
const MIN_IMPRESSION_MS = 300;
/** Cap per item so a tab left open on one post doesn't look like 2 hours of interest. */
const MAX_DWELL_MS = 120_000;

export function useFeedImpressions(enabled: boolean, sort?: string) {
  const visibleSince = useRef(new Map<string, number>());
  const dwell = useRef(new Map<string, number>());
  const observer = useRef<IntersectionObserver | null>(null);
  // Refs attach before effects run, so nodes registered early are observed once the observer exists.
  const nodes = useRef(new Set<HTMLElement>());
  const sortRef = useRef(sort);
  sortRef.current = sort;

  const settle = useCallback((postId: string, now: number) => {
    const start = visibleSince.current.get(postId);
    if (start === undefined) return;
    visibleSince.current.delete(postId);
    const total = (dwell.current.get(postId) || 0) + (now - start);
    dwell.current.set(postId, Math.min(MAX_DWELL_MS, total));
  }, []);

  const flush = useCallback(
    (useBeacon: boolean) => {
      const now = Date.now();
      // Close open intervals but keep them running, so a flush mid-view doesn't drop time.
      for (const postId of [...visibleSince.current.keys()]) {
        settle(postId, now);
        visibleSince.current.set(postId, now);
      }

      const items = [...dwell.current.entries()]
        .filter(([, ms]) => ms >= MIN_IMPRESSION_MS)
        .slice(0, MAX_BATCH)
        .map(([postId, dwellMs]) => ({ postId, dwellMs: Math.round(dwellMs) }));
      for (const { postId } of items) dwell.current.delete(postId);
      if (items.length === 0) return;

      const body = JSON.stringify({ items, sort: sortRef.current });
      try {
        if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
          return;
        }
        void fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Telemetry must never break the feed
      }
    },
    [settle]
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        for (const entry of entries) {
          const postId = (entry.target as HTMLElement).dataset.feedPostId;
          if (!postId) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (!visibleSince.current.has(postId)) visibleSince.current.set(postId, now);
          } else {
            settle(postId, now);
          }
        }
      },
      { threshold: [0, 0.5, 1] }
    );
    for (const node of nodes.current) observer.current.observe(node);

    const interval = window.setInterval(() => flush(false), FLUSH_INTERVAL_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      flush(true);
      observer.current?.disconnect();
      observer.current = null;
    };
  }, [enabled, flush, settle]);

  return useCallback((node: HTMLElement | null) => {
    if (!node) return;
    nodes.current.add(node);
    observer.current?.observe(node);
    return () => {
      nodes.current.delete(node);
      observer.current?.unobserve(node);
      const postId = node.dataset.feedPostId;
      if (postId) settle(postId, Date.now());
    };
  }, [settle]);
}
