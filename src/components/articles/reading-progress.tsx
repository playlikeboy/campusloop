"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const current = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
            setProgress(current);
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-14 z-50 h-1 bg-poll-track">
      <div
        className="h-full origin-left rounded-r-full bg-brand"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
