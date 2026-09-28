"use client";

import { ArrowDown, Loader2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown> | undefined;
  children: React.ReactNode;
  disabled?: boolean;
}

const PULL_THRESHOLD = 55;
const MAX_PULL_DISTANCE = 85;

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getScrollTop = useCallback(() => {
    return (
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      window.pageYOffset ||
      0
    );
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing || e.touches.length !== 1) return;

      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, button, a, iframe, [contenteditable='true'], [data-no-pull-refresh]"
        )
      ) {
        startYRef.current = null;
        startXRef.current = null;
        return;
      }

      // The global gesture must never hijack a nested scroll surface.
      // Reels, comments, sheets and article readers own their own vertical gestures.
      let scrollParent = target?.parentElement ?? null;
      while (scrollParent && scrollParent !== containerRef.current) {
        const style = window.getComputedStyle(scrollParent);
        const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY);
        if (canScrollY && scrollParent.scrollHeight > scrollParent.clientHeight + 1) {
          startYRef.current = null;
          startXRef.current = null;
          return;
        }
        scrollParent = scrollParent.parentElement;
      }

      if (getScrollTop() <= 5) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        pullDistanceRef.current = 0;
        isPullingRef.current = false;
      } else {
        startYRef.current = null;
        startXRef.current = null;
      }
    },
    [disabled, isRefreshing, getScrollTop]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (
        startYRef.current === null ||
        startXRef.current === null ||
        disabled ||
        isRefreshing ||
        e.touches.length !== 1
      )
        return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startYRef.current;
      const diffX = currentX - startXRef.current;
      const scrollTop = getScrollTop();

      // Let horizontal swipes (carousels, tabs, media) behave normally.
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 6) {
        startYRef.current = null;
        startXRef.current = null;
        isPullingRef.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      if (diffY > 0 && scrollTop <= 5) {
        isPullingRef.current = true;
        const dampened = Math.min(diffY ** 0.8 * 1.5, MAX_PULL_DISTANCE);
        pullDistanceRef.current = dampened;
        setPullDistance(dampened);

        if (e.cancelable && diffY > 15) {
          e.preventDefault();
        }
      } else {
        isPullingRef.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    },
    [disabled, isRefreshing, getScrollTop]
  );

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null || disabled || isRefreshing) return;

    const finalPullDistance = pullDistanceRef.current;
    startYRef.current = null;
    startXRef.current = null;

    if (finalPullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      pullDistanceRef.current = 48;
      setPullDistance(48);
      sounds.pop();
      haptics.medium();

      const minDuration = new Promise((resolve) => setTimeout(resolve, 600));
      try {
        await Promise.allSettled([onRefresh(), minDuration]);
      } finally {
        setIsRefreshing(false);
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    } else {
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
    isPullingRef.current = false;
  }, [disabled, isRefreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const isReadyToRelease = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen"
      style={{ overscrollBehaviorY: "contain" }}
    >
      {/* ─── Floating Pull Indicator Badge (Twitter / Instagram style) ─── */}
      <div
        className={cn(
          "pointer-events-none fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ease-out",
          pullDistance > 0 || isRefreshing ? "opacity-100 scale-100" : "opacity-0 scale-75"
        )}
        style={{
          top: `calc(env(safe-area-inset-top, 0px) + ${Math.max(pullDistance * 0.85 + 12, 12)}px)`,
        }}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-card/95 text-foreground border border-border/80 shadow-lg backdrop-blur-md">
          {isRefreshing ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (
            <ArrowDown
              className={cn(
                "size-5 text-muted-foreground transition-transform duration-200",
                isReadyToRelease ? "rotate-180 text-primary" : ""
              )}
              style={{
                transform: isReadyToRelease ? "rotate(180deg)" : `rotate(${progress * 180}deg)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Main Content with subtle translateY elasticity */}
      <div
        style={{
          transform: pullDistance > 0 ? `translate3d(0, ${pullDistance * 0.35}px, 0)` : undefined,
          transition: pullDistance > 0 ? "none" : "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
