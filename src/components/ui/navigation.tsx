"use client";

import {
  Bell,
  Building2,
  Calendar,
  Car,
  ChevronRight,
  Compass,
  GraduationCap,
  Heart,
  Home,
  Menu,
  MessageSquare,
  Plus,
  School,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  User,
  Users,
  VenetianMask,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CampusUnlockedModal } from "@/components/preview/campus-unlocked-modal";
import { DreamCampusesModal } from "@/components/preview/dream-campuses-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { MobileFloatingCreateButton } from "@/components/feed/mobile-floating-create-button";
import { GlobalSearchModal } from "@/components/search/global-search-modal";
import type { UserProfile } from "@/db/schema";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getCollegeShortName } from "@/lib/utils";

interface NavigationProps {
  profile?: UserProfile;
  collegeName?: string;
  isAdmin?: boolean;
  isViewer?: boolean;
  hideHeader?: boolean;
}

function isPathActive(currentPath: string, targetHref: string) {
  if (targetHref === "/feeds") return currentPath === "/feeds";
  if (targetHref === "/chat") return currentPath === "/chat" || currentPath.startsWith("/chat/");
  return currentPath === targetHref || currentPath.startsWith(`${targetHref}/`);
}

// Primary always-visible desktop tabs: Feeds & Explore
const PRIMARY_NAV_TABS = [
  { href: "/feeds", label: "Feeds", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
];

// Expandable secondary tabs revealed on "Expand >"
const EXPANDABLE_NAV_TABS = [
  {
    href: "/academics",
    label: "Academics",
    icon: GraduationCap,
    badge: "Vault",
    badgeColor: "bg-indigo-500/15 text-indigo-400",
  },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/colleges", label: "Colleges", icon: Building2 },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/matching", label: "Matching", icon: Heart },
];

export function Navigation({ profile, collegeName, isViewer, isAdmin, hideHeader }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname() || "/feeds";
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showDreamModal, setShowDreamModal] = useState(false);
  const [anonMode, setAnonMode] = useState<"ALL" | "NON_ANONYMOUS">("ALL");
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const unreadNotificationsCount = useUnreadNotificationsCount();

  // Check if current route is within the expandable hubs
  const isCurrentPathInExpandable = useMemo(
    () => EXPANDABLE_NAV_TABS.some((tab) => isPathActive(pathname, tab.href)),
    [pathname]
  );

  // Dedicated routes (/chat, /events, and /post/[id]) have their own specialized headers; hide main global header
  const isDedicatedHeaderRoute = useMemo(
    () =>
      pathname === "/chat" ||
      pathname.startsWith("/chat/") ||
      pathname === "/events" ||
      pathname.startsWith("/events/") ||
      pathname.startsWith("/post/"),
    [pathname]
  );

  const shouldHideHeader = hideHeader || isDedicatedHeaderRoute;

  // Desktop navigation expansion state (defaults to true if user is on an expandable hub)
  const [isNavExpanded, setIsNavExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("campusloop_nav_expanded");
    if (stored !== null) return stored === "true";
    return false;
  });

  // Automatically expand if the user directly lands on an expandable hub
  useEffect(() => {
    if (isCurrentPathInExpandable) {
      setIsNavExpanded(true);
    }
  }, [isCurrentPathInExpandable]);

  // Global Cmd + K / Ctrl + K shortcut to trigger search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        sounds.tap();
        haptics.light();
        setSearchPaletteOpen(true);
      }
    };
    const handleOpenPalette = () => setSearchPaletteOpen(true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("campusloop_open_search_palette", handleOpenPalette);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("campusloop_open_search_palette", handleOpenPalette);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setShowProfileMenu(false);
    setShowDrawer(false);
  }, [pathname]);

  // Sync feed visibility state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("campusloop_feed_visibility");
      if (saved === "NON_ANONYMOUS" || saved === "ALL") {
        setAnonMode(saved);
      } else if (profile?.feedVisibility) {
        setAnonMode(profile.feedVisibility as "ALL" | "NON_ANONYMOUS");
      }
    }
  }, [profile?.feedVisibility]);

  // The persistent DesktopSidebar already owns global navigation on desktop.
  // Only open the duplicate slide-over menu below the desktop breakpoint.
  useEffect(() => {
    const isMobileOrTablet = () => window.matchMedia("(max-width: 1023px)").matches;
    const handleOpenDrawer = () => {
      if (isMobileOrTablet()) setShowDrawer(true);
      else setShowDrawer(false);
    };
    const handleCloseDrawer = () => setShowDrawer(false);
    const handleResize = () => {
      if (!isMobileOrTablet()) setShowDrawer(false);
    };

    window.addEventListener("campusloop_open_mobile_drawer", handleOpenDrawer);
    window.addEventListener("campusloop_close_mobile_drawer", handleCloseDrawer);
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("campusloop_open_mobile_drawer", handleOpenDrawer);
      window.removeEventListener("campusloop_close_mobile_drawer", handleCloseDrawer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleAnonMode = (mode: "ALL" | "NON_ANONYMOUS") => {
    setAnonMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_feed_visibility", mode);
      window.dispatchEvent(new CustomEvent("campusloop_feed_visibility_change", { detail: mode }));
      fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedVisibility: mode }),
      }).catch(() => {});
    }
    sounds.tap();
    haptics.light();
  };

  return (
    <>
      {/* ─── Desktop Persistent Sidebar (Campus-native Navigation) ─── */}
      <DesktopSidebar
        profile={profile}
        collegeName={collegeName}
        isAdmin={isAdmin}
        isViewer={isViewer}
      />

      {/* ─── Global ⌘K Command Palette / Search Modal ─── */}
      <GlobalSearchModal
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
      />

      {/* ─── Modern Minimal Top Navigation Bar for Mobile / Tablet ─── */}
      {!shouldHideHeader && !searchPaletteOpen && (
        <header className="sticky top-0 z-40 w-full border-b border-border/20 bg-background/80 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          {/* Left: Menu Drawer Toggle + Brand Logo + Campus Selector */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                setShowDrawer(true);
              }}
              className="flex size-8.5 items-center justify-center rounded-full hover:bg-muted/60 text-foreground transition-all cursor-pointer active:scale-95 shrink-0"
              aria-label="Open navigation menu"
              title="All Hubs & Navigation"
            >
              <Menu className="size-4.5" />
            </button>

            <BrandLogo href="/feeds" size="sm" className="shrink-0" />

            {/* Campus Affiliation Pill (Compact & visually secondary) */}
            {collegeName && collegeName !== "Viewer Mode" && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-border/25 bg-muted/20 text-[10px] font-medium text-muted-foreground truncate shrink-0 max-w-[110px] sm:max-w-[170px]">
                <School className="size-2.5 text-primary shrink-0" />
                <span className="truncate">
                  {getCollegeShortName({ name: collegeName }) || collegeName}
                </span>
              </div>
            )}
          </div>

          {/* Center: Desktop Hub Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 py-1 shrink-0" aria-label="Desktop primary navigation">
            {/* Primary tabs: Feeds & Explore */}
            {PRIMARY_NAV_TABS.map((tab) => {
              const isActive = isPathActive(pathname, tab.href);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0",
                    isActive
                      ? "bg-primary/10 text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}

            {/* Expand / Collapse SVG Button */}
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                setIsNavExpanded((prev) => {
                  const next = !prev;
                  try {
                    localStorage.setItem("campusloop_nav_expanded", String(next));
                  } catch {}
                  return next;
                });
              }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 border",
                isNavExpanded
                  ? "bg-muted/70 text-foreground border-border/50 shadow-2xs"
                  : isCurrentPathInExpandable
                    ? "bg-primary/10 text-primary border-primary/25 font-bold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent hover:border-border/30"
              )}
              title={
                isNavExpanded
                  ? "Collapse hubs"
                  : "Expand all hubs (Academics, Communities, Colleges, Events, Match)"
              }
              aria-label={isNavExpanded ? "Collapse navigation hubs" : "Expand all navigation hubs"}
              aria-expanded={isNavExpanded}
            >
              <span>{isNavExpanded ? "Collapse" : "Expand"}</span>
              <ChevronRight
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  isNavExpanded && "rotate-180"
                )}
              />
            </button>

            {/* Expandable Hubs: Academics, Communities, Colleges, Events, Match */}
            <AnimatePresence initial={false}>
              {isNavExpanded && (
                <motion.div
                  key="expandable-nav-tabs"
                  initial={{ opacity: 0, width: 0, scale: 0.96 }}
                  animate={{ opacity: 1, width: "auto", scale: 1 }}
                  exit={{ opacity: 0, width: 0, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="flex items-center gap-1 overflow-hidden"
                >
                  {EXPANDABLE_NAV_TABS.map((tab) => {
                    const isActive = isPathActive(pathname, tab.href);
                    const Icon = tab.icon;

                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        prefetch
                        onClick={() => {
                          sounds.tap();
                          haptics.light();
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0",
                          isActive
                            ? "bg-primary/10 text-primary font-bold shadow-2xs"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span>{tab.label}</span>
                        {tab.badge && !isActive && (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider",
                              tab.badgeColor || "bg-primary/15 text-primary"
                            )}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {/* Right: Search, Post CTA, Chat, Notifications, Theme, Profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                setSearchPaletteOpen(true);
              }}
              className="flex items-center justify-center sm:justify-start gap-1.5 size-8.5 sm:size-auto sm:h-8.5 sm:px-3 rounded-full sm:rounded-xl sm:bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-medium sm:border sm:border-border/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 shrink-0"
              title="Explore & Search CampusLoop (⌘K)"
              aria-label="Explore & Search"
            >
              <Search className="size-4 sm:size-3.5 shrink-0" />
              <span className="hidden sm:inline text-xs font-medium">Search</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-background/80 text-muted-foreground border border-border/50 font-semibold shadow-2xs">
                <span>⌘</span>K
              </kbd>
            </button>

            {/* + Post Button (Desktop only) */}
            {!isViewer && (
              <Link
                href="/post/new"
                prefetch
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className="hidden sm:flex items-center gap-1.5 h-8.5 px-3 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="size-3.5" />
                <span>Post</span>
              </Link>
            )}

            {/* Direct Messages (Desktop only, mobile uses bottom tab) */}
            {!isViewer && (
              <Link
                href="/chat"
                prefetch
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className={cn(
                  "relative hidden sm:flex size-8.5 items-center justify-center rounded-full border border-border/40 transition-all cursor-pointer",
                  isPathActive(pathname, "/chat")
                    ? "bg-foreground text-background"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                title="Messages"
              >
                <MessageSquare className="size-3.5" />
              </Link>
            )}

            {/* Desktop-only Theme Toggle (Mobile has theme switch inside sidebar drawer) */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Desktop-only Profile Avatar / Dropdown Toggle (Mobile uses bottom tab & sidebar drawer) */}
            <div className="hidden sm:block">
              {profile ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setShowProfileMenu((prev) => !prev);
                    }}
                    className="flex size-8.5 items-center justify-center rounded-full border-2 border-primary/30 hover:border-primary transition-all cursor-pointer p-0.5 overflow-hidden"
                    aria-label="User profile menu"
                  >
                    <Avatar className="size-full">
                      <AvatarImage src={profile.avatarUrl || ""} alt={profile.displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-black">
                        {profile.displayName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {/* Profile Dropdown Menu */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-border/50 bg-background/98 p-2 shadow-2xl backdrop-blur-xl"
                        >
                          {/* Profile Info Header */}
                          <div className="px-3 py-2 border-b border-border/30">
                            <p className="text-sm font-black text-foreground truncate">{profile.displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                            <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold">
                              <span className="flex items-center gap-1 text-primary">
                                <Zap className="size-3" />
                                <span>{profile.points || 0} LP</span>
                              </span>
                              <span className="text-muted-foreground truncate max-w-[120px]">
                                {collegeName}
                              </span>
                            </div>
                          </div>

                          {/* Menu Options */}
                          <div className="space-y-1 py-1 text-xs font-semibold">
                            <Link
                              href={`/@${profile.username}`}
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-foreground hover:bg-muted/60 transition-colors"
                            >
                              <User className="size-3.5 text-muted-foreground" />
                              <span>View Profile</span>
                            </Link>

                            <Link
                              href="/settings"
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-foreground hover:bg-muted/60 transition-colors"
                            >
                              <Settings className="size-3.5 text-muted-foreground" />
                              <span>Settings &amp; Privacy</span>
                            </Link>

                            {isAdmin && (
                              <Link
                                href="/admin"
                                onClick={() => setShowProfileMenu(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-primary font-bold hover:bg-primary/10 transition-colors"
                              >
                                <ShieldCheck className="size-3.5" />
                                <span>Admin Console</span>
                              </Link>
                            )}
                          </div>

                          <div className="border-t border-border/30 pt-1">
                            <SignOutButton className="w-full justify-start rounded-xl px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10" />
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-primary text-primary-foreground hover:opacity-90 shadow-xs"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
        </header>
      )}

      {/* ─── Slide-Over Navigation Drawer (Available for BOTH Desktop & Mobile) ─── */}
      <AnimatePresence>
        {showDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
              aria-hidden="true"
            />

            {/* Slide-Out Drawer Sheet */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 flex h-full w-[85%] max-w-[340px] flex-col justify-between overflow-y-auto bg-background/98 border-r border-border/50 px-4 py-4 shadow-2xl backdrop-blur-2xl lg:hidden"
              aria-label="Navigation drawer"
            >
              <div className="space-y-4">
                {/* Header: Brand + Close Button */}
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <BrandLogo href="/feeds" size="md" />
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="flex size-8.5 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95 cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="size-4.5" />
                  </button>
                </div>

                {/* Profile Header (Minimal) */}
                {profile ? (
                  <Link
                    href={`/@${profile.username}`}
                    onClick={() => setShowDrawer(false)}
                    className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-muted/20 p-2 hover:bg-muted/50 hover:border-border/60 transition-all group"
                  >
                    <Avatar className="size-8.5 shrink-0 border border-border/50">
                      <AvatarImage src={profile.avatarUrl || ""} alt={profile.displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {profile.displayName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {profile.displayName}
                        </span>
                        {profile.onboardingCompleted && (
                          <ShieldCheck className="size-3 text-primary shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="truncate">@{profile.username}</span>
                        {profile.points ? (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-primary font-semibold text-[10px] shrink-0">
                              {profile.points} LP
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/sign-in"
                    onClick={() => setShowDrawer(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold py-2 px-3 transition-colors"
                  >
                    <User className="size-3.5" />
                    <span>Sign In / Join Campus</span>
                  </Link>
                )}

                {/* Anonymity Mode Switcher */}
                <div className="rounded-xl border border-border/30 bg-muted/15 p-2 space-y-1.5">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">Timeline Privacy</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-background/50 p-0.5 border border-border/30 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleAnonMode("ALL")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                        anonMode === "ALL"
                          ? "bg-card text-foreground shadow-2xs border border-border/40 font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <VenetianMask className="size-3.5 text-purple-400" />
                      <span>All Posts &amp; Anon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAnonMode("NON_ANONYMOUS")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                        anonMode === "NON_ANONYMOUS"
                          ? "bg-card text-foreground shadow-2xs border border-border/40 font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ShieldCheck className="size-3.5 text-emerald-400" />
                      <span>Public Only</span>
                    </button>
                  </div>
                </div>

                {/* Categorized Navigation Links */}
                <div className="space-y-4 pt-1">
                  <div>
                    <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Explore Campus
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {[
                        { href: "/academics", label: "Academics", icon: GraduationCap },
                        { href: "/matching", label: "Matching", icon: Heart },
                        { href: "/notifications", label: "Notifications", icon: Bell },
                        { href: "/communities", label: "Communities", icon: Users },
                        { href: "/events", label: "Events", icon: Calendar },
                        { href: "/campus", label: "Campus Hub", icon: Building2 },
                        { href: "/colleges", label: "Colleges", icon: School },
                        { href: "/confessions", label: "Confessions", icon: VenetianMask },
                      ].map((item) => {
                        const Icon = item.icon;
                        const active = isPathActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setShowDrawer(false)}
                            className={cn(
                              "flex items-center justify-between rounded-[var(--r-md)] px-3 py-2 text-xs font-medium transition-all",
                              active
                                ? "bg-[var(--primary-soft)] text-[var(--primary)] font-semibold border border-[var(--primary-soft-border)]"
                                : "text-[var(--text)] hover:bg-[var(--surface-sunken)]"
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2.5">
                              <Icon className="size-4 shrink-0 text-[var(--text-secondary)]" />
                              <span>{item.label}</span>
                            </span>
                            {item.href === "/notifications" && unreadNotificationsCount > 0 && (
                              <span className="flex min-w-5 h-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                                {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Account & System */}
                  <div>
                    <span className="px-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Settings &amp; Tools
                    </span>
                    <div className="mt-1 space-y-0.5">
                      <Link
                        href="/settings"
                        onClick={() => setShowDrawer(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60"
                      >
                        <Settings className="size-4 text-muted-foreground" />
                        <span>Settings &amp; Privacy</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setShowDrawer(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black text-primary hover:bg-primary/10"
                        >
                          <ShieldCheck className="size-4" />
                          <span>Admin Console</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-border/40 pt-3 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-muted-foreground font-medium">Theme Mode</span>
                  <ThemeToggle />
                </div>
                {profile && (
                  <SignOutButton className="w-full justify-center rounded-xl py-2 text-xs font-bold text-destructive hover:bg-destructive/10" />
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile create action appears after the reader starts scrolling. */}
      <MobileFloatingCreateButton isViewer={isViewer} />

      {/* Preview Modals */}
      <CampusUnlockedModal isOpen={showUnlockModal} onClose={() => setShowUnlockModal(false)} />
      <DreamCampusesModal isOpen={showDreamModal} onClose={() => setShowDreamModal(false)} />
    </>
  );
}
