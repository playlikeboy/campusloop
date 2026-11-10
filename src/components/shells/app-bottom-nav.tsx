"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_BOTTOM_ITEMS, ROUTES } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import { isPathActive, navPress, profileHref, shouldHideBottomNav } from "./nav-utils";

interface AppBottomNavProps {
  /** Hide Post and Chat for preview accounts and signed-out visitors. */
  restricted?: boolean;
  /** Signed-in username; Profile links to /@username. */
  username?: string | null;
}

/** Mobile tab bar: Home, Explore, Post (violet sticker), Chat, Profile. Solid surface, thumb height. */
export function AppBottomNav({ restricted, username }: AppBottomNavProps) {
  const pathname = usePathname() || ROUTES.home;
  if (shouldHideBottomNav(pathname)) return null;

  const items = MOBILE_BOTTOM_ITEMS.filter(
    (item) => !(restricted && (item.href === ROUTES.chat || item.href === ROUTES.newPost))
  ).map((item) => (item.href === ROUTES.profile ? { ...item, href: profileHref(username) } : item));

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
          const active = isPathActive(pathname, item.href);
          const isPost = item.href === ROUTES.newPost;

          if (isPost) {
            return (
              <li key={item.href} className="flex items-center justify-center">
                <Link
                  href={item.href}
                  prefetch
                  onClick={navPress}
                  aria-label="Create a post"
                  className="flex size-12 items-center justify-center rounded-sticker bg-brand text-brand-fg shadow-sticker transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
                >
                  <Icon className="size-6" strokeWidth={2.5} aria-hidden="true" />
                </Link>
              </li>
            );
          }

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
