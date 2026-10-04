"use client";

import {
  Bell,
  Building2,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Compass,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  MessageSquare,
  PackageSearch,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  Users,
  VenetianMask,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { UserProfile } from "@/db/schema";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl, getCollegeShortName } from "@/lib/utils";

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
  badge?: string;
  badgeColor?: string;
}

interface NavSectionDef {
  title: string;
  items: NavItemDef[];
}

const SECTIONS: NavSectionDef[] = [
  {
    title: "HOME",
    items: [
      { href: "/feeds", label: "Home", icon: Home },
      { href: "/explore", label: "Explore", icon: Compass },
    ],
  },
  {
    title: "CAMPUS",
    items: [
      { href: "/events", label: "Events", icon: Calendar },
      { href: "/communities", label: "Communities", icon: Users },
      { href: "/academics", label: "Academics", icon: GraduationCap, badge: "Vault" },
      { href: "/colleges", label: "Colleges", icon: Building2 },
    ],
  },
  {
    title: "LIVING & UTILITIES",
    items: [
      { href: "/living", label: "Living Hub", icon: Sparkles },
      { href: "/buy-and-sell", label: "Buy & Sell", icon: ShoppingBag },
      { href: "/housing", label: "Housing & Flats", icon: Building2 },
      { href: "/lost-and-found", label: "Lost & Found", icon: PackageSearch },
      { href: "/rideshare", label: "Ride Share", icon: Car },
      { href: "/atlas", label: "Campus Atlas", icon: MapPin },
    ],
  },
  {
    title: "CONNECT",
    items: [
      { href: "/chat", label: "Chat", icon: MessageSquare },
      { href: "/dating", label: "Match", icon: Heart },
    ],
  },
  {
    title: "MARKET",
    items: [
      { href: "/marketplace", label: "Campus Market", icon: Store },
    ],
  },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/feeds") return pathname === "/feeds" || pathname === "/";
  if (href === "/living") return pathname === "/living" || pathname === "/utilities";
  if (href === "/chat") return pathname === "/chat" || pathname.startsWith("/chat/");
  if (href === "/dating") return pathname === "/dating" || pathname.startsWith("/matching");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopSidebar({ profile, collegeName, isAdmin, isViewer }: DesktopSidebarProps) {
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
      window.dispatchEvent(new CustomEvent("campusloop_feed_visibility_change", { detail: next }));
    }
    sounds.tap();
    haptics.light();
  };

  const openSearch = () => {
    sounds.tap();
    haptics.light();
    window.dispatchEvent(new CustomEvent("campusloop_open_search_palette"));
  };

  const collegeDisplay =
    collegeName && collegeName !== "Viewer Mode" && collegeName !== "Campus"
      ? getCollegeShortName({ name: collegeName }) || collegeName
      : collegeName || "Campus";

  const avatar = profile ? getAvatarUrl(profile.avatarUrl, profile.username) : "";

  return (
    <aside
      className={cn(
        "hidden lg:flex sticky top-0 h-screen z-30 flex-col border-r border-border/50 bg-background/95 backdrop-blur-xl transition-[width] duration-200 select-none overflow-x-hidden shrink-0",
        collapsed ? "w-18" : "w-64"
      )}
      aria-label="Application main sidebar"
    >
      {/* ── Header: Logo + Scope / Collapse ── */}
      <div className="flex h-16 shrink-0 items-center justify-between px-3.5 border-b border-border/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandLogo href="/feeds" size="sm" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black tracking-tight text-foreground truncate">
                CampusLoop
              </span>
              <span className="text-[11px] font-medium text-muted-foreground truncate flex items-center gap-1">
                <span className="truncate">{collegeDisplay}</span>
                {profile?.onboardingCompleted && (
                  <ShieldCheck className="size-3 text-primary shrink-0" />
                )}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="flex size-7 items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </div>

      {/* ── Quick Search Trigger ── */}
      <div className="px-3 pt-3 shrink-0">
        <button
          type="button"
          onClick={openSearch}
          className={cn(
            "w-full flex items-center gap-2 rounded-xl border border-border/50 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground text-xs font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            collapsed ? "justify-center p-2.5" : "px-3 py-2"
          )}
          title="Search CampusLoop (⌘K)"
          aria-label="Quick Search"
        >
          <Search className="size-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search...</span>
              <kbd className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-background/80 text-muted-foreground border border-border/60">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* ── Primary Navigation Links ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {!collapsed && (
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
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
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer relative",
                    active
                      ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    collapsed && "justify-center px-2 py-2.5"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("size-4 shrink-0 transition-transform group-hover:scale-105", active ? "text-primary-foreground" : "")} />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider",
                        active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.href === "/chat" && (
                    <span
                      className={cn(
                        "size-2 rounded-full bg-emerald-500",
                        active ? "bg-white ring-1 ring-primary" : ""
                      )}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer / Primary Actions ── */}
      <div className="shrink-0 p-3 border-t border-border/40 space-y-2">
        {/* + Post Button */}
        {!isViewer && (
          <Link
            href="/post/new"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer",
              collapsed ? "p-2.5" : "py-2.5 px-3"
            )}
            title="Create Post"
          >
            <Plus className="size-4 shrink-0" />
            {!collapsed && <span>Create Post</span>}
          </Link>
        )}

        {/* Anonymity Switcher */}
        <button
          type="button"
          onClick={toggleAnon}
          className={cn(
            "w-full flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/60 text-xs font-semibold transition-all cursor-pointer",
            collapsed ? "justify-center p-2" : "px-3 py-2",
            anonMode === "ALL" ? "text-primary" : "text-emerald-600 dark:text-emerald-400"
          )}
          title={anonMode === "ALL" ? "Timeline: All Posts & Confessions" : "Timeline: Public Only (No Anon)"}
        >
          <VenetianMask className="size-4 shrink-0" />
          {!collapsed && (
            <span className="truncate text-left text-[11px]">
              {anonMode === "ALL" ? "All & Anon" : "Public Only"}
            </span>
          )}
        </button>

        {/* User Card & Controls Row */}
        <div className="flex items-center justify-between gap-1 pt-1">
          {profile ? (
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-2.5 rounded-xl hover:bg-muted/50 transition-all p-1 min-w-0 flex-1",
                collapsed && "justify-center"
              )}
              title={`@${profile.username}`}
            >
              <Avatar className="size-8 rounded-full border border-border/60 shrink-0">
                <AvatarImage src={avatar} alt={profile.displayName} />
                <AvatarFallback className="text-xs font-bold">
                  {profile.displayName[0] || "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold text-foreground truncate leading-tight">
                    {profile.displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    @{profile.username}
                  </p>
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className={cn(
                "flex items-center gap-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-xs font-bold p-2 text-foreground",
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
                href="/notifications"
                className="relative flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-background" />
                )}
              </Link>
              <Link
                href="/settings"
                className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
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
