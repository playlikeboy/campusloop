"use client";

import { useEffect, useRef } from "react";

/**
 * useScrollIsolation Hook
 * Prevents wheel and scroll event propagation from a secondary scroll container
 * (such as a right sidebar or context rail) to the main page / parent window / feed stream.
 *
 * Behavior:
 * 1. When the container has scrollable overflow:
 *    - Allows natural scrolling within the container.
 *    - When the user hits the top or bottom boundary, wheel events are trapped (`e.preventDefault()`),
 *      preventing "scroll chaining" that would otherwise scroll the main feed / page.
 * 2. When the container fits entirely within the screen (no overflow):
 *    - All wheel events over the container are stopped (`e.preventDefault()`), ensuring that
 *      accidental scrolling while the cursor is hovering over the rightbar never causes the
 *      middle feed / page to scroll unexpectedly.
 */
export function useScrollIsolation<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If predominantly horizontal swipe, don't interfere
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const { scrollTop, scrollHeight, clientHeight } = el;
      const canScroll = scrollHeight > clientHeight + 1;

      if (!canScroll) {
        // Content fits on screen: prevent bubbling to window/middle column
        e.preventDefault();
        return;
      }

      const isScrollingUp = e.deltaY < 0;
      const isScrollingDown = e.deltaY > 0;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if ((isScrollingUp && isAtTop) || (isScrollingDown && isAtBottom)) {
        // At top or bottom boundary: prevent chaining to parent window / middle column
        e.preventDefault();
      }
    };

    // Use passive: false so preventDefault can be called
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return ref;
}
