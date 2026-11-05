"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { MOBILE_BOTTOM_ITEMS } from "@/constants/navigation";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { isPathActive, shouldHideBottomNav } from "./nav-utils";

interface AppBottomNavProps {
  /** Hide Post and Chat for preview accounts and signed-out visitors. */
  restricted?: boolean;
}

export function AppBottomNav({ restricted }: AppBottomNavProps) {
  const pathname = usePathname() || "/feeds";

  const items = useMemo(
    () =>
      MOBILE_BOTTOM_ITEMS.filter((item) => {
        if (restricted && (item.href === "/chat" || item.href === "/post/new")) return false;
        return true;
      }),
    [restricted]
  );

  if (shouldHideBottomNav(pathname)) return null;

  const press = () => {
    sounds.tap();
    haptics.light();
  };

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[var(--z-sticky-nav)] border-t border-border bg-surface/95 backdrop-blur lg:hidden",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <ul
        className={cn(
          "grid h-[var(--nav-mobile-h)] items-stretch",
          items.length === 5 ? "grid-cols-5" : items.length === 4 ? "grid-cols-4" : "grid-cols-3"
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = isPathActive(pathname, item.href);
          const isPost = item.href === "/post/new";

          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                prefetch
                onClick={press}
                aria-label={isPost ? "Create a post" : item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full min-h-11 w-full flex-col items-center justify-center gap-1 text-xs font-medium",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:scale-[0.98]",
                  active ? "text-brand-text" : "text-fg-muted hover:text-fg"
                )}
              >
                {active && !isPost && (
                  <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand" aria-hidden="true" />
                )}
                {isPost ? (
                  <span className="flex size-10 items-center justify-center rounded-md bg-brand text-brand-fg shadow-sm">
                    <Icon className="size-5" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                ) : (
                  <>
                    <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                    <span className="max-w-full truncate leading-none">{item.label}</span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
