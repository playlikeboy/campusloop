"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/**
 * Floating "back to top" button for long scrolling surfaces.
 *
 * Only appears once the reader is well past the fold, and hides while they are
 * scrolling down so it never covers content they are actively reading.
 */
export function ScrollToTop({ threshold = 1200, className }: { threshold?: number; className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        // Show when deep in the page and heading back up
        setVisible(y > threshold && y < lastY);
        lastY = y;
        frame = 0;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => {
        haptics.light();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={cn(
        "fixed bottom-24 right-4 z-40 flex size-11 items-center justify-center rounded-full bg-surface-raised text-fg shadow-lg transition-[opacity,transform] duration-200 cursor-pointer hover:bg-surface-muted active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:bottom-8 md:right-8",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        className
      )}
    >
      <ArrowUp className="size-4.5" />
    </button>
  );
}
