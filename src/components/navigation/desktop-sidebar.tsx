"use client";

import {
  Bell,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Heart,
  Home,
  MessageSquare,
  Plus,
  Search,
  Settings,
  User,
  Users,
  VenetianMask,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo, BrandLogoIcon } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { UserProfile } from "@/db/schema";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl } from "@/lib/utils";

interface DesktopSidebarProps {
  profile?: UserProfile;
  collegeName?: string;
  isAdmin?: boolean;
  isViewer?: boolean;
}

interface NavItemDef {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Keep the everyday destinations visible; secondary settings stay in the footer.
const NAV_ITEMS: NavItemDef[] = [
  { href: "/feeds", label: "Home", icon: Home },
  { href: "/academics", label: "Academics", icon: GraduationCap },
  { href: "/matching", label: "Matching", icon: Heart },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/campus", label: "Campus", icon: Building2 },
  { href: "/chat", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/feeds") return pathname === "/feeds" || pathname === "/";
  if (href === "/academics") return pathname.startsWith("/academics");
  if (href === "/communities") return pathname.startsWith("/communities");
  if (href === "/events") return pathname.startsWith("/events");
  if (href === "/campus") {
    return (
      pathname.startsWith("/campus") ||
      pathname.startsWith("/living") ||
      pathname.startsWith("/housing") ||
      pathname.startsWith("/marketplace") ||
      pathname.startsWith("/buy-and-sell") ||
      pathname.startsWith("/lost-and-found") ||
      pathname.startsWith("/rideshare") ||
      pathname.startsWith("/atlas")
    );
  }
  if (href === "/chat") return pathname === "/chat" || pathname.startsWith("/chat/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopSidebar({
  profile,
  collegeName: _collegeName,
  isAdmin: _isAdmin,
  isViewer,
}: DesktopSidebarProps) {
  const pathname = usePathname() || "/feeds";
  const unreadCount = useUnreadNotificationsCount();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("campusloop_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [anonMode, setAnonMode] = useState<"ALL" | "NON_ANONYMOUS">("ALL");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("campusloop_feed_visibility");
      if (saved === "NON_ANONYMOUS" || saved === "ALL") {
        setAnonMode(saved);
      }
    }
  }, []);

  const toggleSidebar = () => {
    sounds.tap();
    haptics.light();
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("campusloop_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const toggleAnon = () => {
    const next = anonMode === "ALL" ? "NON_ANONYMOUS" : "ALL";
    setAnonMode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_feed_visibility", next);
      window.dispatchEvent(
        new CustomEvent("campusloop_feed_visibility_change", { detail: next })
      );
      fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedVisibility: next }),
      }).catch(() => {});
    }
    sounds.tap();
    haptics.light();
  };

  const openSearch = () => {
    sounds.tap();
    haptics.light();
    window.dispatchEvent(new CustomEvent("campusloop_open_search_palette"));
  };

  const avatar = profile ? getAvatarUrl(profile.avatarUrl, profile.username) : "";

  return (
    <aside
      className={cn(
        "hidden lg:flex sticky top-0 h-screen z-30 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-[width] duration-200 select-none overflow-hidden shrink-0",
        collapsed ? "w-18" : "w-60"
      )}
      aria-label="Application main sidebar"
    >
      {/* ── Brand Header & Toggle ── */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-[var(--border)] shrink-0">
        {!collapsed ? (
          <>
            <BrandLogo size="md" href="/feeds" />
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex size-7 items-center justify-center rounded-[var(--r-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="size-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1">
            <Link
              href="/feeds"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="flex size-8 items-center justify-center rounded-[var(--r-sm)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              title="CampusLoop Home"
            >
              <BrandLogoIcon size="sm" className="size-6 shrink-0" />
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex size-7 items-center justify-center rounded-[var(--r-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Quick Search Trigger (⌘K) ── */}
      <div className={cn("shrink-0 pt-3 pb-1", collapsed ? "px-2" : "px-3")}>
        <button
          type="button"
          onClick={openSearch}
          className={cn(
            "w-full flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border-strong)] text-xs font-medium transition-all cursor-pointer group",
            collapsed ? "justify-center p-2.5" : "px-3 py-2"
          )}
          title="Search CampusLoop (⌘K)"
          aria-label="Quick Search"
        >
          <Search className="size-3.5 shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--text)] transition-colors" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">Search</span>
              <kbd className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-[var(--r-sm)] bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] shrink-0">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* ── Primary Navigation Links (Max 6 + Profile) ── */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className={cn(
                "group flex items-center gap-3 rounded-[var(--r-md)] px-3 py-2.5 text-xs font-medium transition-all cursor-pointer relative",
                active
                  ? "bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft-border)] font-semibold shadow-2xs"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]",
                collapsed && "justify-center px-2 py-2.5"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-transform group-hover:scale-105",
                  active ? "text-[var(--primary)]" : "text-[var(--text-secondary)]"
                )}
              />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {item.href === "/chat" && (
                <span
                  className={cn(
                    "size-2 rounded-full bg-emerald-500",
                    active ? "ring-1 ring-white" : ""
                  )}
                />
              )}
              {item.href === "/notifications" && unreadCount > 0 && (
                <span
                  className={cn(
                    "flex min-w-5 h-5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground",
                    collapsed && "absolute right-1 top-1 size-2 min-w-0 h-2 p-0"
                  )}
                  aria-label="Unread notifications"
                >
                  {!collapsed && (unreadCount > 99 ? "99+" : unreadCount)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer / Primary Actions ── */}
      <div className="shrink-0 p-3 border-t border-[var(--border)] space-y-2">
        {/* + Post Button */}
        {!isViewer && (
          <Link
            href="/post/new"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-[var(--r-md)] bg-[var(--primary)] hover:opacity-95 text-white text-xs font-medium transition-all active:scale-[0.98] cursor-pointer shadow-xs",
              collapsed ? "p-2.5" : "py-2.5 px-3"
            )}
            title="Create Post"
          >
            <Plus className="size-4 shrink-0" />
            {!collapsed && <span>New Post</span>}
          </Link>
        )}

        {/* Anonymity Switcher */}
        <button
          type="button"
          onClick={toggleAnon}
          className={cn(
            "w-full flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-xs transition-colors cursor-pointer",
            collapsed ? "justify-center p-2" : "px-3 py-2",
            anonMode === "ALL" ? "text-[var(--primary)]" : "text-emerald-600 dark:text-emerald-400"
          )}
          title={
            anonMode === "ALL"
              ? "Timeline: All Posts & Anon"
              : "Timeline: Public Only"
          }
        >
          <VenetianMask className="size-4 shrink-0" />
          {!collapsed && (
            <span className="truncate text-left text-[11px] font-medium">
              {anonMode === "ALL" ? "All Posts & Anon" : "Public Only"}
            </span>
          )}
        </button>

        {/* User Card & Controls Row */}
        <div className="flex items-center justify-between gap-1 pt-1">
          {profile ? (
            <Link
              href={`/@${profile.username}`}
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--r-md)] hover:bg-[var(--surface-sunken)] transition-colors p-1 min-w-0 flex-1",
                collapsed && "justify-center"
              )}
              title={`@${profile.username}`}
            >
              <Avatar className="size-8 rounded-full border border-[var(--border)] shrink-0">
                <AvatarImage src={avatar} alt={profile.displayName} />
                <AvatarFallback className="text-xs font-semibold bg-[var(--surface-sunken)] text-[var(--text)]">
                  {profile.displayName[0] || "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-semibold text-[var(--text)] truncate leading-tight">
                    {profile.displayName}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate">
                    @{profile.username}
                  </p>
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className={cn(
                "flex items-center gap-2 rounded-[var(--r-md)] bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-xs font-medium p-2 text-[var(--text)]",
                collapsed ? "justify-center" : "flex-1"
              )}
            >
              <User className="size-4 shrink-0" />
              {!collapsed && <span>Sign In</span>}
            </Link>
          )}

          {!collapsed && (
            <div className="flex items-center gap-1 shrink-0">
              <Link
                href="/settings"
                className="flex size-8 items-center justify-center rounded-[var(--r-sm)] hover:bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="size-4" />
              </Link>
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
