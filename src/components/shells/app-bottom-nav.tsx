"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_BOTTOM_ITEMS, ROUTES } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import { isPathActive, navPress, shouldHideBottomNav } from "./nav-utils";

interface AppBottomNavProps {
  /** Hide Chat for preview accounts and signed-out visitors. */
  restricted?: boolean;
  /** Kept for callers; the You tab always opens /profile, which is your own page. */
  username?: string | null;
}

/** Mobile tab bar: Home, Events, Learn, Chat, You. Solid surface, thumb height. */
export function AppBottomNav({ restricted }: AppBottomNavProps) {
  const pathname = usePathname() || ROUTES.home;
  if (shouldHideBottomNav(pathname)) return null;

  const items = MOBILE_BOTTOM_ITEMS.filter((item) => !(restricted && item.href === ROUTES.chat));

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky-nav)] border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul
        className="grid h-[var(--nav-mobile-h)] items-stretch"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            isPathActive(pathname, item.href) ||
            Boolean(item.match?.some((href) => isPathActive(pathname, href)));
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                prefetch
                onClick={navPress}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full min-h-11 w-full flex-col items-center justify-center gap-1 text-xs font-medium transition-ui",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:scale-95",
                  active ? "font-semibold text-brand-text" : "text-fg-muted hover:text-fg"
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                <span className="max-w-full truncate leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
