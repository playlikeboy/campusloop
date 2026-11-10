"use client";

import { Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { DESKTOP_NAV_ITEMS } from "@/constants/navigation";
import type { UserProfile } from "@/db/schema";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl } from "@/lib/utils";
import { formatCount, isPathActive } from "./nav-utils";

interface AppSidebarProps {
  profile?: UserProfile;
  isAdmin?: boolean;
  isViewer?: boolean;
}

/** Desktop-only persistent sidebar (>= 1024px). Sticky in the flex row so content offsets naturally. */
export function AppSidebar({ profile, isAdmin, isViewer }: AppSidebarProps) {
  const pathname = usePathname() || "/feeds";
  const unreadCount = useUnreadNotificationsCount();
  const avatar = profile ? getAvatarUrl(profile.avatarUrl, profile.username) : "";

  const press = () => {
    sounds.tap();
    haptics.light();
  };

  return (
    <aside
      aria-label="Sidebar"
      className="sticky top-0 hidden h-dvh w-[var(--nav-desktop-w)] shrink-0 flex-col border-r border-border bg-surface lg:flex"
    >
      <div className="flex h-14 shrink-0 items-center px-5">
        <BrandLogo href="/feeds" size="md" />
      </div>

      <nav aria-label="Main" className="no-scrollbar flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {DESKTOP_NAV_ITEMS.map((item) => {
            if (isViewer && item.href === "/chat") return null;
            const Icon = item.icon;
            const active = isPathActive(pathname, item.href);
            const showUnread = item.href === "/notifications" && unreadCount > 0;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  onClick={press}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-brand-subtle text-brand-text"
                      : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                  )}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {showUnread && (
                    <span
                      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold tabular-nums text-brand-fg"
                      aria-label={`${unreadCount} unread notifications`}
                    >
                      {formatCount(unreadCount)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          {isAdmin && (
            <li>
              <Link
                href="/admin"
                onClick={press}
                aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ShieldCheck className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="flex-1 truncate">Admin console</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="shrink-0 space-y-3 border-t border-border p-3">
        {!isViewer && profile && (
          <Link
            href="/post/new"
            prefetch
            onClick={press}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-brand-fg hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <Plus className="size-4" aria-hidden="true" />
            New post
          </Link>
        )}

        {profile ? (
          <Link
            href={`/@${profile.username}`}
            onClick={press}
            className="flex min-h-11 items-center gap-3 rounded-md p-1.5 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={avatar} alt="" />
              <AvatarFallback className="bg-surface-muted text-sm font-semibold text-fg">
                {profile.displayName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-tight text-fg">{profile.displayName}</span>
              <span className="block truncate text-xs text-fg-muted">@{profile.username}</span>
            </span>
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="flex h-11 w-full items-center justify-center rounded-md border border-border text-sm font-medium text-fg hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
