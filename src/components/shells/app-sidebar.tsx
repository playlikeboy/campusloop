"use client";

import { Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { DESKTOP_NAV_SECTIONS, type NavItem, ROUTES } from "@/constants/navigation";
import type { ShellProfile } from "@/lib/server-cache";
import { cn, getAvatarUrl, initialOf } from "@/lib/utils";
import { isPathActive, navPress, profileHref } from "./nav-utils";

interface AppSidebarProps {
  profile?: ShellProfile;
  isAdmin?: boolean;
  isViewer?: boolean;
}

const rowClass =
  "flex min-h-11 items-center gap-3 rounded-full px-4 text-[0.9375rem] font-medium transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Desktop-only persistent sidebar (>= 1024px): Home, Events, Learn, Chat, You, one Post button, your profile. */
export function AppSidebar({ profile, isAdmin, isViewer }: AppSidebarProps) {
  const pathname = usePathname() || ROUTES.home;
  const avatar = profile ? getAvatarUrl(profile.avatarUrl, profile.username) : "";

  return (
    <aside
      aria-label="Sidebar"
      className="sticky top-0 hidden h-dvh w-[var(--nav-desktop-w)] shrink-0 flex-col border-r border-border bg-surface lg:flex"
    >
      <div className="flex h-16 shrink-0 items-center px-6">
        <BrandLogo href={ROUTES.home} size="md" />
      </div>

      <nav aria-label="Main" className="no-scrollbar flex-1 overflow-y-auto px-3 py-2">
        {!isViewer && profile && (
          <Link
            href={ROUTES.newPost}
            prefetch
            onClick={navPress}
            className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[0.9375rem] font-semibold text-brand-fg transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <Plus className="size-5" strokeWidth={2.5} aria-hidden="true" />
            Post
          </Link>
        )}

        <div className="space-y-3">
          {DESKTOP_NAV_SECTIONS.map((section) => {
            const items = section.items.filter((item) => !(isViewer && item.href === ROUTES.chat));
            if (items.length === 0) return null;
            // A group with one row (Events, Chat) needs no heading; the row says it.
            const showHeading = items.length > 1 && section.group;
            const headingId = `sidebar-${section.id ?? section.group}`;
            return (
              <section key={section.id ?? section.group} aria-labelledby={showHeading ? headingId : undefined}>
                {showHeading && (
                  <h2 id={headingId} className="px-4 pb-1 text-xs font-semibold text-fg-subtle">
                    {section.group}
                  </h2>
                )}
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <SidebarRow key={item.href} item={item} active={isPathActive(pathname, item.href)} />
                  ))}
                </ul>
              </section>
            );
          })}
          {isAdmin && (
            <ul>
              <li>
                <Link
                  href="/admin"
                  onClick={navPress}
                  className={cn(rowClass, "text-fg-muted hover:bg-surface-muted hover:text-fg")}
                >
                  <ShieldCheck className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span className="truncate">Admin</span>
                </Link>
              </li>
            </ul>
          )}
        </div>

      </nav>

      <div className="shrink-0 border-t border-border p-3">
        {profile ? (
          <Link
            href={profileHref(profile.username)}
            onClick={navPress}
            className="flex min-h-11 items-center gap-3 rounded-full p-1.5 pr-3 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={avatar} alt="" />
              <AvatarFallback className="bg-surface-muted text-sm font-semibold text-fg">
                {initialOf(profile.displayName, "U")}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-tight text-fg">
                {profile.displayName}
              </span>
              <span className="block truncate text-xs text-fg-muted">@{profile.username}</span>
            </span>
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="flex h-11 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-fg transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}

function SidebarRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        prefetch
        onClick={navPress}
        aria-current={active ? "page" : undefined}
        className={cn(
          rowClass,
          active ? "bg-brand-subtle font-semibold text-brand-text" : "text-fg-muted hover:bg-surface-muted hover:text-fg"
        )}
      >
        <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}
