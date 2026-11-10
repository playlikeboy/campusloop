import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Bottom action bar for cart and checkout. On phones it sits fixed right above the
 * app bottom nav (and the safe area); from lg up it falls back into the page flow.
 * Pages using it should add bottom padding on mobile so content clears it.
 */
export function StickyActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(var(--nav-mobile-h)+env(safe-area-inset-bottom,0px))] z-[var(--z-sticky-nav)] border-t border-border bg-surface px-4 py-3 lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0",
        className
      )}
    >
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  );
}
