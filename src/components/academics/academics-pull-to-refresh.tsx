"use client";

import { Loader2, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PULL_THRESHOLD = 76;
const MAX_PULL = 120;

export function AcademicsPullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, iframe, [data-no-pull-refresh]")) return;
      startY.current = event.touches[0]?.clientY ?? 0;
      pulling.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pulling.current || refreshing || window.scrollY > 0) {
        pulling.current = false;
        return;
      }

      const currentY = event.touches[0]?.clientY ?? 0;
      const distance = currentY - startY.current;
      if (distance <= 0) {
        setPullDistance(0);
        return;
      }

      const eased = Math.min(MAX_PULL, distance * 0.52);
      setPullDistance(eased);

      // Keep browser's native overscroll from competing with our indicator.
      if (distance > 4) event.preventDefault();
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;

      if (pullDistance >= PULL_THRESHOLD * 0.52) {
        setRefreshing(true);
        setPullDistance(PULL_THRESHOLD * 0.52);
        router.refresh();
        window.setTimeout(() => window.location.reload(), 350);
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, refreshing, router]);

  const progress = Math.min(1, pullDistance / (PULL_THRESHOLD * 0.52));
  const visible = pullDistance > 2 || refreshing;

  return (
    <div
      className="relative min-h-screen"
      style={{ overscrollBehaviorY: "contain" }}
      data-academics-pull-refresh
    >
      <div
        className={cn(
          "pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+3.5rem)] z-[70] -translate-x-1/2 transition-all duration-150",
          visible ? "opacity-100" : "opacity-0"
        )}
        aria-hidden={!visible}
      >
        <div
          className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/95 text-primary shadow-lg backdrop-blur-md"
          style={{ transform: `translateY(${Math.min(18, pullDistance * 0.18)}px)` }}
        >
          {refreshing ? (
            <Loader2 className="size-4.5 animate-spin" />
          ) : (
            <RotateCw
              className="size-4.5 transition-transform"
              style={{ transform: `rotate(${progress * 180}deg)` }}
            />
          )}
        </div>
        <div className="mt-1 rounded-full bg-background/90 px-2 py-0.5 text-[9px] font-bold text-muted-foreground shadow-sm backdrop-blur-md">
          {refreshing ? "Refreshing…" : progress >= 1 ? "Release to refresh" : "Pull to refresh"}
        </div>
      </div>

      {children}
    </div>
  );
}
