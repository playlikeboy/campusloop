"use client";

import { Bell, Menu, Search, Settings, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { UserProfile } from "@/db/schema";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl, getCollegeShortName } from "@/lib/utils";
import { formatCount, isPathActive } from "./nav-utils";

interface AppTopBarProps {
  profile?: UserProfile;
  collegeName?: string;
  isAdmin?: boolean;
  onOpenDrawer: () => void;
  onOpenSearch: () => void;
}

const iconButton =
  "relative flex size-11 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]";

export function AppTopBar({ profile, collegeName, isAdmin, onOpenDrawer, onOpenSearch }: AppTopBarProps) {
  const pathname = usePathname() || "/feeds";
  const unreadCount = useUnreadNotificationsCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const press = () => {
    sounds.tap();
    haptics.light();
  };

  const campus =
    collegeName && collegeName !== "Viewer Mode" ? getCollegeShortName({ name: collegeName }) || collegeName : null;
  const avatar = profile ? getAvatarUrl(profile.avatarUrl, profile.username) : "";
  const notificationsActive = isPathActive(pathname, "/notifications");

  return (
    <header className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[var(--container)] items-center gap-2 px-[var(--gutter)]">
        <button
          type="button"
          onClick={() => {
            press();
            onOpenDrawer();
          }}
          className={cn(iconButton, "-ml-2 lg:hidden")}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <BrandLogo href="/feeds" size="sm" />
          {campus && <span className="hidden truncate text-xs text-fg-muted sm:inline">{campus}</span>}
        </div>

        <button
          type="button"
          onClick={() => {
            press();
            onOpenSearch();
          }}
          className="hidden h-10 w-full max-w-md items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-sm text-fg-muted hover:border-border-strong hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
          aria-label="Search CampusLoop"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="rounded-sm border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-fg-subtle">
            Ctrl K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              press();
              onOpenSearch();
            }}
            className={cn(iconButton, "lg:hidden")}
            aria-label="Search"
          >
            <Search className="size-5" />
          </button>

          <Link
            href="/notifications"
            prefetch
            onClick={press}
            className={cn(iconButton, notificationsActive && "text-brand-text")}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-current={notificationsActive ? "page" : undefined}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span
                className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[0.625rem] font-semibold tabular-nums leading-none text-brand-fg"
                aria-hidden="true"
              >
                {formatCount(unreadCount)}
              </span>
            )}
          </Link>

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          {profile ? (
            <div className="relative hidden lg:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => {
                  press();
                  setMenuOpen((v) => !v);
                }}
                className="flex size-11 items-center justify-center rounded-md hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar className="size-8">
                  <AvatarImage src={avatar} alt="" />
                  <AvatarFallback className="bg-surface-muted text-xs font-semibold text-fg">
                    {profile.displayName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Account"
                  className="absolute right-0 top-12 z-[var(--z-dropdown)] w-64 rounded-lg bg-surface-raised p-1.5 shadow-lg"
                >
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold text-fg">{profile.displayName}</p>
                    <p className="truncate text-xs text-fg-muted">@{profile.username}</p>
                    {campus && <p className="mt-1 truncate text-xs text-fg-subtle">{campus}</p>}
                  </div>
                  <div className="my-1 border-t border-border" />
                  <MenuLink href={`/@${profile.username}`} icon={User} label="View profile" />
                  <MenuLink href="/settings" icon={Settings} label="Settings and privacy" />
                  {isAdmin && <MenuLink href="/admin" icon={ShieldCheck} label="Admin console" />}
                  <div className="my-1 border-t border-border" />
                  <SignOutButton
                    variant="menu-item"
                    className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-danger hover:bg-danger-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>Sign out</span>
                  </SignOutButton>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="hidden h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:inline-flex"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-fg hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-4 text-fg-muted" />
      {label}
    </Link>
  );
}
