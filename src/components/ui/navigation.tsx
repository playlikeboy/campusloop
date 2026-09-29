"use client";

import {
  Bell,
  Building2,
  Calendar,
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
  User,
  Users,
  VenetianMask,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CampusUnlockedModal } from "@/components/preview/campus-unlocked-modal";
import { DreamCampusesModal } from "@/components/preview/dream-campuses-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MOBILE_BOTTOM_ITEMS } from "@/constants/navigation";
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
}

/**
 * Fullscreen creation / viewer flows where bottom navigation should be temporarily hidden.
 */
const HIDE_GLOBAL_MOBILE_NAV = ["/chat/", "/stories/new", "/story/", "/post/new", "/academics/upload"];

function isMobileFlow(pathname: string) {
  return HIDE_GLOBAL_MOBILE_NAV.some((prefix) => pathname.startsWith(prefix));
}

function isPathActive(currentPath: string, targetHref: string) {
  if (targetHref === "/feeds") return currentPath === "/feeds";
  if (targetHref === "/chat") return currentPath === "/chat" || currentPath.startsWith("/chat/");
  return currentPath === targetHref || currentPath.startsWith(`${targetHref}/`);
}

// Top navbar primary tabs on desktop
const TOP_NAV_TABS = [
  { href: "/feeds", label: "Feeds", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  {
    href: "/academics",
    label: "Academics",
    icon: GraduationCap,
    badge: "Vault",
    badgeColor: "bg-indigo-500/15 text-indigo-400",
  },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/colleges", label: "Colleges", icon: Building2 },
  { href: "/events", label: "Events", icon: Calendar, xlOnly: true },
  { href: "/dating", label: "Match", icon: Heart, xlOnly: true },
];

export function Navigation({ profile, collegeName, isViewer, isAdmin }: NavigationProps) {
  const pathname = usePathname() || "/feeds";
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showDreamModal, setShowDreamModal] = useState(false);
  const [anonMode, setAnonMode] = useState<"ALL" | "NON_ANONYMOUS">("ALL");
  const unreadNotificationsCount = useUnreadNotificationsCount();

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

  // Listen for mobile/desktop drawer toggle events from header or buttons
  useEffect(() => {
    const handleOpenDrawer = () => setShowDrawer(true);
    const handleCloseDrawer = () => setShowDrawer(false);
    window.addEventListener("campusloop_open_mobile_drawer", handleOpenDrawer);
    window.addEventListener("campusloop_close_mobile_drawer", handleCloseDrawer);
    return () => {
      window.removeEventListener("campusloop_open_mobile_drawer", handleOpenDrawer);
      window.removeEventListener("campusloop_close_mobile_drawer", handleCloseDrawer);
    };
  }, []);

  const toggleAnonMode = (mode: "ALL" | "NON_ANONYMOUS") => {
    setAnonMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_feed_visibility", mode);
      window.dispatchEvent(new CustomEvent("campusloop_feed_visibility_change", { detail: mode }));
    }
    sounds.tap();
    haptics.light();
  };

  const mobileBottomItems = useMemo(
    () =>
      MOBILE_BOTTOM_ITEMS.filter((item) => {
        if (isViewer && item.href === "/chat") return false;
        if (isViewer && item.href === "/post/new") return false;
        return true;
      }),
    [isViewer]
  );

  return (
    <>
      {/* ─── Modern Sticky Top Navigation Bar (Utilizes Space Full on PC) ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/35 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          {/* Left: Hamburger Drawer Toggle + Brand Logo + Campus Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                setShowDrawer(true);
              }}
              className="flex size-11 sm:size-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 items-center justify-center rounded-xl border border-border/40 bg-card/60 hover:bg-muted/70 text-foreground transition-all cursor-pointer active:scale-95 shrink-0"
              aria-label="Open navigation menu"
              title="All Hubs &amp; Navigation"
            >
              <Menu className="size-5 sm:size-4.5" />
            </button>

            <BrandLogo href="/feeds" size="md" />

            {/* College Affiliation Pill Badge (Only on ultra-wide screens to prevent navbar collision) */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/40 bg-muted/30 text-xs font-semibold text-muted-foreground truncate shrink-0 max-w-[170px]">
              <School className="size-3 text-primary shrink-0" />
              <span className="truncate">
                {collegeName && collegeName !== "Viewer Mode" && collegeName !== "Campus"
                  ? getCollegeShortName({ name: collegeName }) || collegeName
                  : collegeName || "Campus"}
              </span>
              {profile?.onboardingCompleted && <ShieldCheck className="size-3 text-primary shrink-0" />}
            </div>
          </div>

          {/* Center: Desktop Hub Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 py-1 shrink-0">
            {TOP_NAV_TABS.map((tab) => {
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
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0",
                    tab.xlOnly && "hidden xl:inline-flex",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-black"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
          </nav>

          {/* Right: Search, Mode Switcher, Post CTA, Chat, Notifications, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search Pill (Icon on compact viewports, Pill on xl+) */}
            <Link
              href="/explore"
              prefetch
              className="flex size-11 sm:size-8.5 xl:w-auto xl:px-3 xl:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 items-center justify-center rounded-full border border-border/40 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 shrink-0"
              title="Explore & Search CampusLoop"
              aria-label="Explore & Search"
            >
              <Search className="size-4.5 sm:size-3.5 shrink-0" />
              <span className="hidden xl:inline text-[11px] ml-1.5">Search</span>
              <kbd className="hidden 2xl:inline text-[9px] font-mono px-1 rounded bg-muted text-muted-foreground ml-1">
                ⌘K
              </kbd>
            </Link>

            {/* Desktop Anonymity Mode Toggle (Only on xl+ viewports to preserve navbar space) */}
            <div className="hidden xl:flex items-center rounded-full bg-muted/50 p-0.5 border border-border/40 text-xs shrink-0">
              <button
                type="button"
                onClick={() => toggleAnonMode("ALL")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer",
                  anonMode === "ALL"
                    ? "bg-card text-foreground shadow-xs border border-border/50 font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="All posts including anonymous confessions"
              >
                <VenetianMask className="size-3 text-purple-400" />
                <span>Anon</span>
              </button>
              <button
                type="button"
                onClick={() => toggleAnonMode("NON_ANONYMOUS")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer",
                  anonMode === "NON_ANONYMOUS"
                    ? "bg-card text-foreground shadow-xs border border-border/50 font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Verified public posts only"
              >
                <ShieldCheck className="size-3 text-emerald-400" />
                <span>Public</span>
              </button>
            </div>

            {/* + Post Button (Desktop only, mobile uses docked bottom FAB) */}
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

            {/* Notifications Bell (Shown on both Mobile & Desktop with min 44x44px target) */}
            <Link
              href="/notifications"
              prefetch
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className={cn(
                "relative flex size-11 sm:size-8.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 items-center justify-center rounded-full border border-border/40 transition-all cursor-pointer active:scale-95",
                isPathActive(pathname, "/notifications")
                  ? "bg-foreground text-background"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="size-4.5 sm:size-3.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground shadow-xs animate-pulse">
                  {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                </span>
              )}
            </Link>

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
                  href="/handler/sign-in"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-primary text-primary-foreground hover:opacity-90 shadow-xs"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

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
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-Out Drawer Sheet */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 flex h-full w-[85%] max-w-[340px] flex-col justify-between overflow-y-auto bg-background/98 border-r border-border/50 px-4 py-4 shadow-2xl backdrop-blur-2xl"
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

                {/* Profile Header */}
                {profile ? (
                  <Link
                    href={`/@${profile.username}`}
                    onClick={() => setShowDrawer(false)}
                    className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/75 p-3 hover:bg-muted/40 transition-colors shadow-2xs group"
                  >
                    <Avatar className="size-12 shrink-0 border-2 border-primary/30 ring-2 ring-primary/10 shadow-xs mt-0.5">
                      <AvatarImage src={profile.avatarUrl || ""} alt={profile.displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-black">
                        {profile.displayName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">
                          {profile.displayName}
                        </span>
                        {profile.onboardingCompleted && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.2 text-[9px] font-black text-primary uppercase tracking-wide">
                            <ShieldCheck className="size-3 text-primary shrink-0" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                      <span className="block truncate text-xs text-muted-foreground font-medium">
                        @{profile.username}
                      </span>
                      {collegeName && collegeName !== "Viewer Mode" && (
                        <p className="line-clamp-2 text-xs font-semibold text-foreground/80 leading-snug">
                          {collegeName}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                          <Zap className="size-3 fill-primary/20" />
                          <span>{profile.points || 0} LP</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-border/40 bg-card/60 p-3.5 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Exploring CampusLoop</p>
                    <Link
                      href="/handler/sign-in"
                      onClick={() => setShowDrawer(false)}
                      className="block w-full rounded-xl bg-primary text-center py-2.5 text-xs font-black text-primary-foreground shadow-xs hover:opacity-90 active:scale-98 transition-all"
                    >
                      Sign In / Join Campus
                    </Link>
                  </div>
                )}

                {/* Anonymity Mode Switcher (Always accessible in Drawer for Mobile & Desktop) */}
                <div className="rounded-2xl border border-border/40 bg-card/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Timeline Privacy</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">Feed Filter</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-muted/50 p-1 border border-border/40 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleAnonMode("ALL")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        anonMode === "ALL"
                          ? "bg-card text-foreground shadow-xs border border-border/50 font-black"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <VenetianMask className="size-3.5 text-purple-400" />
                      <span>All + Anon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAnonMode("NON_ANONYMOUS")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        anonMode === "NON_ANONYMOUS"
                          ? "bg-card text-foreground shadow-xs border border-border/50 font-black"
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
                  {/* Core Features (Deduplicated: Feeds and Explore live in bottom nav) */}
                  <div>
                    <span className="px-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Core Campus
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {[
                        { href: "/academics", label: "Academics Vault", icon: GraduationCap, badge: "PYQs" },
                        { href: "/communities", label: "Communities & Clubs", icon: Users },
                        { href: "/colleges", label: "College Directory", icon: Building2 },
                        { href: "/events", label: "Events & Hackathons", icon: Calendar },
                        {
                          href: "/confessions",
                          label: "Confessions Vault",
                          icon: VenetianMask,
                          badge: "Anon",
                        },
                        { href: "/dating", label: "Campus Dating", icon: Heart },
                      ].map((item) => {
                        const Icon = item.icon;
                        const active = isPathActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setShowDrawer(false)}
                            className={cn(
                              "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                              active
                                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                : "text-foreground hover:bg-muted/60"
                            )}
                          >
                            <span className="flex items-center gap-2.5">
                              <Icon className="size-4 shrink-0" />
                              <span>{item.label}</span>
                            </span>
                            {item.badge && (
                              <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                {item.badge}
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

      {/* ─── Mobile Bottom Navigation Bar (md:hidden) ─── */}
      {!isMobileFlow(pathname) && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex h-[calc(3.75rem+max(env(safe-area-inset-bottom,0px),0px))] items-center justify-around border-t border-border/40 bg-background/95 px-2 backdrop-blur-xl md:hidden pb-[max(env(safe-area-inset-bottom,0px),6px)] shadow-lg"
          aria-label="Mobile bottom navigation"
        >
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = isPathActive(pathname, item.href);

            if (item.href === "/more") {
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setShowDrawer(true);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-90 cursor-pointer min-w-14 min-h-[44px]",
                    showDrawer ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Open full campus menu drawer"
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-2xl transition-all",
                      showDrawer ? "bg-primary/15 text-primary shadow-xs" : "text-muted-foreground"
                    )}
                  >
                    <Menu className="size-5" />
                  </span>
                  <span className="text-[10px] font-black tracking-tight">Menu</span>
                </button>
              );
            }

            if (item.href === "/post/new") {
              return (
                <Link
                  key="post-create"
                  href="/post/new"
                  prefetch
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                  }}
                  className="relative flex flex-col items-center justify-center -translate-y-3.5 group cursor-pointer active:scale-95 transition-transform shrink-0 min-w-14"
                  aria-label="Create new campus post"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform duration-200 group-hover:scale-105">
                    <Plus className="size-6 stroke-[2.75] transition-transform duration-200 group-hover:rotate-90" />
                  </span>
                  <span className="text-[10px] font-black text-primary mt-0.5">Post</span>
                </Link>
              );
            }

            if (item.href === "/profile") {
              const profileHref = profile ? `/@${profile.username}` : "/handler/sign-in";
              const isProfileActive = profile
                ? pathname.startsWith(`/@${profile.username}`) || pathname === "/profile"
                : pathname === "/handler/sign-in";

              return (
                <Link
                  key="profile"
                  href={profileHref}
                  prefetch
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-90 cursor-pointer min-w-14 min-h-[44px]",
                    isProfileActive ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="View user profile"
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-2xl transition-all",
                      isProfileActive ? "bg-primary/15 text-primary shadow-xs" : "text-muted-foreground"
                    )}
                  >
                    {profile ? (
                      <Avatar className="size-6 border border-border/50">
                        <AvatarImage src={profile.avatarUrl || ""} alt={profile.displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                          {profile.displayName[0]}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="size-5" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] tracking-tight",
                      isProfileActive ? "font-black text-primary" : "font-semibold"
                    )}
                  >
                    Profile
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-90 cursor-pointer min-w-14 min-h-[44px]",
                  isActive ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-2xl transition-all",
                    isActive ? "bg-primary/15 text-primary shadow-xs" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("size-5 transition-transform", isActive && "scale-110 stroke-[2.5]")} />
                </span>
                <span
                  className={cn(
                    "text-[10px] tracking-tight",
                    isActive ? "font-black text-primary" : "font-semibold"
                  )}
                >
                  {item.label}
                </span>
                {item.href === "/chat" && !isViewer && (
                  <span className="absolute top-1.5 right-3 size-2 rounded-full bg-primary ring-2 ring-background" />
                )}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Preview Modals */}
      <CampusUnlockedModal isOpen={showUnlockModal} onClose={() => setShowUnlockModal(false)} />
      <DreamCampusesModal isOpen={showDreamModal} onClose={() => setShowDreamModal(false)} />
    </>
  );
}
