"use client";

import { type RefObject, useEffect } from "react";
import type { PlayerHandle } from "./youtube-player";

interface Actions {
  next: () => void;
  prev: () => void;
  toggleDone: () => void;
  toggleSidebar: () => void;
  toggleHelp: () => void;
}

/**
 * Player keyboard shortcuts. Ignored while typing, and Space/arrows are left
 * alone on buttons, links, tabs and other controls so keyboard users can still
 * press and move between them.
 */
export function usePlayerKeys(playerRef: RefObject<PlayerHandle | null>, actions: Actions) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true]") || e.metaKey || e.ctrlKey || e.altKey)
        return;
      const onControl = Boolean(
        el.closest("button, a, [role=tab], [role=tablist], [role=radio], [role=checkbox], [role=group]")
      );
      const p = playerRef.current;
      if (e.key === " " && p && !onControl) {
        e.preventDefault();
        p.togglePlay();
      } else if (e.key === "ArrowRight" && p && !onControl) p.seek(p.currentTime() + 5);
      else if (e.key === "ArrowLeft" && p && !onControl) p.seek(p.currentTime() - 5);
      else if (e.key === "n") actions.next();
      else if (e.key === "p") actions.prev();
      else if (e.key === "m") actions.toggleDone();
      else if (e.key === "[") actions.toggleSidebar();
      else if (e.key === "?") actions.toggleHelp();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playerRef, actions]);
}
