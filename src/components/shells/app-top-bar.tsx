"use client";

import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ROUTES } from "@/constants/navigation";
import type { ShellProfile } from "@/lib/server-cache";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { cn, getCollegeShortName } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { formatCount, isPathActive, navPress } from "./nav-utils";
import { PointsChip } from "./points-chip";

interface AppTopBarProps {
  profile?: ShellProfile;
  collegeName?: string;
  isAdmin?: boolean;
  onOpenDrawer: () => void;
  onOpenSearch: () => void;
}

const iconButton =
  "relative flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95";

/** Top bar: menu + logo (mobile), search, Loop Points, notifications, account (desktop). Solid surface. */
export function AppTopBar({ profile, collegeName, isAdmin, onOpenDrawer, onOpenSearch }: AppTopBarProps) {
  const pathname = usePathname() || ROUTES.home;
  const unreadCount = useUnreadNotificationsCount();
  const campus =
    collegeName && collegeName !== "Viewer Mode"
      ? getCollegeShortName({ name: collegeName }) || collegeName
      : null;
  const notificationsActive = isPathActive(pathname, ROUTES.notifications);

  return (
    <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-[var(--container)] items-center gap-1 px-[var(--gutter)] lg:h-16 lg:gap-2">
        <button
          type="button"
          onClick={() => {
            navPress();
            onOpenDrawer();
          }}
          className={cn(iconButton, "-ml-2.5 lg:hidden")}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <BrandLogo href={ROUTES.home} size="sm" />
          {campus && <span className="hidden truncate text-sm text-fg-muted sm:inline">{campus}</span>}
        </div>

        <button
          type="button"
          onClick={() => {
            navPress();
            onOpenSearch();
          }}
          className="hidden h-11 w-full max-w-md items-center gap-2.5 rounded-full bg-surface-muted px-4 text-sm text-fg-subtle transition-ui hover:bg-surface-sunken hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
          aria-label="Search people, posts and colleges"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left">Search people, posts, colleges</span>
          <kbd className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-xs text-fg-subtle">Ctrl K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-0.5 lg:gap-1">
          <button
            type="button"
            onClick={() => {
              navPress();
              onOpenSearch();
            }}
            className={cn(iconButton, "lg:hidden")}
            aria-label="Search"
          >
            <Search className="size-5" />
          </button>

          {profile && <PointsChip points={profile.points ?? 0} />}

          <Link
            href={ROUTES.notifications}
            prefetch
            onClick={navPress}
            className={cn(iconButton, notificationsActive && "bg-brand-subtle text-brand-text")}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-current={notificationsActive ? "page" : undefined}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span
                className="absolute right-1 top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-brand px-1 text-[0.6875rem] font-bold tabular-nums leading-none text-brand-fg ring-2 ring-surface"
                aria-hidden="true"
              >
                {formatCount(unreadCount)}
              </span>
            )}
          </Link>

          {profile ? (
            <div className="hidden lg:block">
              <AccountMenu profile={profile} campus={campus} isAdmin={isAdmin} />
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="ml-1 inline-flex h-10 items-center rounded-full bg-brand px-4 text-sm font-semibold text-brand-fg transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
