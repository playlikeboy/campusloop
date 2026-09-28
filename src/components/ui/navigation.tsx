"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Building2,
  Cake,
  Calendar,
  Compass,
  Flame,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  LayoutGrid,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  School,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  UserCircle,
  Users,
  VenetianMask,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { CampusUnlockedModal } from "@/components/preview/campus-unlocked-modal";
import { DreamCampusesModal } from "@/components/preview/dream-campuses-modal";
import {
  AnimateBellRing,
  AnimateMessageSquare,
  AnimatePlus,
  AnimatedIcon,
} from "@/components/ui/animated-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DESKTOP_NAV_ITEMS, MOBILE_BOTTOM_ITEMS, type NavItem } from "@/constants/navigation";
import type { UserProfile } from "@/db/schema";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface NavigationProps {
  profile?: UserProfile;
  collegeName?: string;
  isAdmin?: boolean;
  isViewer?: boolean;
}

/**
 * Fullscreen creation / viewer flows where bottom navigation should be temporarily hidden.
 * Deep hub pages (like /app/academics, /app/communities, /app/more) preserve the bottom bar.
 */
const HIDE_GLOBAL_MOBILE_NAV = [
  "/app/chat/",
  "/chat/",
  "/app/stories/new",
  "/stories/new",
  "/app/story/",
  "/story/",
  "/app/post/new",
  "/post/new",
  "/app/academics/upload",
  "/academics/upload",
];

function isMobileFlow(pathname: string) {
  return HIDE_GLOBAL_MOBILE_NAV.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Dual-domain path normalizer ensuring campsy.app ("/") and campusloop.space ("/app")
 * match active tabs identically with zero desync.
 */
function isPathActive(currentPath: string, targetHref: string) {
  if (targetHref === "/feeds") return currentPath === "/feeds";
  if (targetHref === "/chat") return currentPath === "/chat" || currentPath.startsWith("/chat/");
  return currentPath === targetHref || currentPath.startsWith(`${targetHref}/`);
}

export function Navigation({ profile, collegeName, isViewer }: NavigationProps) {
  const pathname = usePathname() || "/app";
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showDreamModal, setShowDreamModal] = useState(false);
  const [anonMode, setAnonMode] = useState<"ALL" | "NON_ANONYMOUS">("ALL");
  const unreadNotificationsCount = useUnreadNotificationsCount();

  // Close menus on route change
  useEffect(() => {
    setShowProfileMenu(false);
    setShowMobileDrawer(false);
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

  // Listen for mobile drawer toggle events from header or buttons
  useEffect(() => {
    const handleOpenDrawer = () => setShowMobileDrawer(true);
    const handleCloseDrawer = () => setShowMobileDrawer(false);
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

  const desktopNavItems = useMemo(
    () =>
      DESKTOP_NAV_ITEMS.filter((item) => {
        if (isViewer && ["/app/chat", "/app/dating", "/app/matching"].includes(item.href)) {
          return false;
        }
        return true;
      }),
    [isViewer]
  );

  const mobileBottomItems = useMemo(
    () =>
      MOBILE_BOTTOM_ITEMS.filter((item) => {
        if (isViewer && item.href === "/app/chat") return false;
        if (isViewer && item.href === "/app/post/new") return false;
        return true;
      }),
    [isViewer]
  );

  return (
    <>
      {/* ─── Desktop Navigation Sidebar ─── */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[248px] flex-col justify-between overflow-y-auto border-r border-border/70 bg-background/92 px-3 py-4 backdrop-blur-xl md:flex">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 py-1.5">
            <BrandLogo href="/app" size="md" />

            <div className="flex items-center gap-1">
              <Link
                href="/app/chat"
                prefetch
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-xl transition-all",
                  isPathActive(pathname, "/app/chat")
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                aria-label="Direct messages"
              >
                <AnimatedIcon icon={AnimateMessageSquare} animation="pop" size={18} />
              </Link>

              <Link
                href="/app/notifications"
                prefetch
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-full transition-all",
                  isPathActive(pathname, "/app/notifications")
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                aria-label="Notifications"
              >
                <AnimatedIcon icon={AnimateBellRing} animation="bell" size={18} playKey={unreadNotificationsCount} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-black text-white">
                    {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          <nav className="space-y-1 pt-1" aria-label="Primary navigation">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isPathActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold transition-all",
                    isActive
                      ? "bg-primary/10 font-bold text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <AnimateIcon animateOnHover animation="path">
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105",
                        isActive ? "text-primary stroke-2" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                  </AnimateIcon>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        item.badgeColor || "bg-primary/15 text-primary"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Anonymity Mode Switcher (Rule 6 in AGENTS.md) */}
          <div className="pt-2 px-1">
            <div className="rounded-xl border border-border/40 bg-card/40 p-1.5 shadow-2xs">
              <div className="flex items-center justify-between px-1.5 pb-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                  Feed Mode
                </span>
                <span className="text-[9px] font-bold text-primary">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-1 bg-muted/60 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleAnonMode("ALL")}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md py-1 text-[11px] font-bold transition-all cursor-pointer",
                    anonMode === "ALL"
                      ? "bg-card text-foreground shadow-xs border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Show all posts including anonymous confessions"
                >
                  <VenetianMask className="size-3 text-purple-400" />
                  <span>All &amp; Anon</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleAnonMode("NON_ANONYMOUS")}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md py-1 text-[11px] font-bold transition-all cursor-pointer",
                    anonMode === "NON_ANONYMOUS"
                      ? "bg-card text-foreground shadow-xs border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Show only verified public non-anonymous posts"
                >
                  <ShieldCheck className="size-3 text-emerald-400" />
                  <span>Public</span>
                </button>
              </div>
            </div>
          </div>

          {isViewer ? (
            <div className="space-y-2 px-1 pt-2">
              <div className="space-y-2 rounded-2xl border border-amber-500/20 bg-linear-to-b from-amber-500/10 to-transparent p-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-500">
                    <School className="size-3" />
                    Campus Preview
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDreamModal(true)}
                    className="text-[10px] font-bold text-muted-foreground underline"
                  >
                    Dream Hubs
                  </button>
                </div>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  Exploring from outside. Verify your college to unlock participation.
                </p>
                <Button
                  onClick={() => setShowUnlockModal(true)}
                  className="h-8 w-full rounded-xl bg-foreground text-xs font-black text-background"
                >
                  <GraduationCap className="size-3.5" />
                  Unlock Campus
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-1 pt-2">
              <Link href="/app/post/new" className="block">
                <Button className="h-10.5 w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-emerald-500/20">
                  <AnimatedIcon icon={AnimatePlus} animation="pop" size={18} strokeWidth={2.5} />
                  Post
                </Button>
              </Link>
            </div>
          )}
        </div>

        {profile ? (
          <div className="relative pt-2">
            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    className="absolute bottom-16 left-0 right-0 z-50 space-y-1 rounded-2xl border border-border/50 bg-card p-1.5 shadow-xl"
                  >
                    <Link
                      href="/app/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      <UserCircle className="size-4 text-muted-foreground" />
                      View Profile
                    </Link>
                    <Link
                      href="/app/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      <MoreHorizontal className="size-4 text-muted-foreground" />
                      Settings & Privacy
                    </Link>
                    <div className="flex items-center justify-between border-t border-border/30 px-2 pt-1.5">
                      <ThemeToggle className="size-7 rounded-lg border-none bg-transparent hover:bg-muted" />
                      <SignOutButton />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => setShowProfileMenu((open) => !open)}
              className="flex w-full items-center justify-between rounded-full p-2.5 text-left transition-colors hover:bg-muted/50"
              aria-expanded={showProfileMenu}
              aria-haspopup="menu"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar className="size-9.5 shrink-0 border border-border/40">
                  <AvatarImage src={profile.avatarUrl || ""} />
                  <AvatarFallback className="bg-muted text-xs font-bold">
                    {profile.displayName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black">{profile.displayName}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">@{profile.username}</span>
                </span>
              </span>
              <MoreHorizontal className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <Link
            href="/handler/sign-in"
            className="block rounded-full bg-muted px-3 py-2.5 text-center text-xs font-bold"
          >
            Sign In
          </Link>
        )}
      </aside>

      {/* ─── Mobile Bottom Navigation (Always Visible, Perfectly Colored) ─── */}
      {!isMobileFlow(pathname) && (
        <nav
          aria-label="Main mobile navigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/95 pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pt-1 shadow-[0_-4px_24px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:hidden select-none"
        >
          <div className="mx-auto flex h-16 w-full max-w-md items-center justify-around px-2">
            {mobileBottomItems.map((item) => {
              const Icon = item.icon;
              const isCreate = item.href === "/app/post/new";
              const isMore = item.href === "/app/more";
              const active = isMore ? showMobileDrawer : isPathActive(pathname, item.href);

              if (isCreate) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onClick={() => {
                      sounds.tap();
                      haptics.medium();
                    }}
                    className="relative -mt-4 flex flex-col items-center justify-center text-primary group"
                    aria-label="Create post"
                  >
                    <span className="grid size-12 place-items-center rounded-full bg-linear-to-tr from-emerald-500 to-teal-400 text-white shadow-[0_4px_18px_rgba(0,210,133,0.45)] ring-4 ring-background transition-transform active:scale-95 group-hover:scale-105">
                      <Plus className="size-6 text-white stroke-[2.5]" />
                    </span>
                    <span className="mt-1 text-[10px] font-black text-emerald-500 dark:text-emerald-400 leading-none">
                      Create
                    </span>
                  </Link>
                );
              }

              const getActiveColor = () => {
                switch (item.href) {
                  case "/app":
                    return "text-emerald-500 dark:text-emerald-400";
                  case "/app/discover":
                    return "text-cyan-500 dark:text-cyan-400";
                  case "/app/chat":
                    return "text-violet-500 dark:text-violet-400";
                  case "/app/more":
                    return "text-amber-500 dark:text-amber-400";
                  default:
                    return "text-primary";
                }
              };

              const getIndicatorGlow = () => {
                switch (item.href) {
                  case "/app":
                    return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]";
                  case "/app/discover":
                    return "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.9)]";
                  case "/app/chat":
                    return "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.9)]";
                  case "/app/more":
                    return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)]";
                  default:
                    return "bg-primary shadow-[0_0_8px_var(--primary)]";
                }
              };

              const itemInner = (
                <div
                  className={cn(
                    "relative flex min-w-14 flex-1 flex-col items-center justify-center gap-1 py-1 transition-all rounded-xl cursor-pointer select-none",
                    active ? getActiveColor() : "text-muted-foreground/80 hover:text-foreground active:scale-95"
                  )}
                >
                  {/* Top glowing indicator pill */}
                  {active && (
                    <span
                      className={cn("absolute -top-1.5 h-1 w-5 rounded-full transition-all", getIndicatorGlow())}
                    />
                  )}

                  <span className={cn("grid size-7 place-items-center transition-transform", active && "scale-110")}>
                    <Icon
                      className={cn(
                        "size-5 transition-colors",
                        active ? `${getActiveColor()} stroke-[2.4]` : "text-muted-foreground/80 stroke-[1.8]"
                      )}
                    />
                  </span>

                  <span
                    className={cn(
                      "truncate text-[10.5px] leading-none transition-colors",
                      active ? `font-black ${getActiveColor()}` : "font-semibold text-muted-foreground/80"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              );

              if (isMore) {
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setShowMobileDrawer(true);
                    }}
                    className="flex-1 flex justify-center items-center"
                    aria-label="Open sidebar menu and all campus options"
                  >
                    {itemInner}
                  </button>
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
                  className="flex-1 flex justify-center items-center"
                  aria-current={active ? "page" : undefined}
                >
                  {itemInner}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ─── Mobile Sidebar Drawer (Slide-Out Sheet with Academics & All Hubs) ─── */}
      <AnimatePresence>
        {showMobileDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMobileDrawer(false)}
              className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />

            {/* Slide-out Sidebar Drawer Sheet */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 flex h-full w-[85%] max-w-[320px] flex-col justify-between overflow-y-auto bg-background/98 border-r border-border/50 px-4 py-4 shadow-2xl backdrop-blur-2xl md:hidden"
              aria-label="Mobile navigation drawer"
            >
              <div className="space-y-4">
                {/* Header: Brand + Close Button */}
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <BrandLogo href="/app" size="md" />
                  <button
                    type="button"
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex size-8.5 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95 cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="size-4.5" />
                  </button>
                </div>

                {/* Profile Header */}
                {profile ? (
                  <Link
                    href="/app/profile"
                    onClick={() => setShowMobileDrawer(false)}
                    className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 p-3 hover:bg-muted/40 transition-colors shadow-2xs group"
                  >
                    <Avatar className="size-11 shrink-0 border border-primary/30 ring-2 ring-primary/10">
                      <AvatarImage src={profile.avatarUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-black">
                        {profile.displayName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">
                          {profile.displayName}
                        </span>
                        {profile.onboardingCompleted && (
                          <ShieldCheck className="size-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <span className="block truncate text-xs text-muted-foreground">@{profile.username}</span>
                      <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground truncate max-w-full">
                        <School className="size-2.5 shrink-0 text-primary" />
                        <span className="truncate">{collegeName || "Campus"}</span>
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-border/40 bg-card/60 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Exploring CampusLoop</p>
                    <Link
                      href="/handler/sign-in"
                      onClick={() => setShowMobileDrawer(false)}
                      className="block w-full rounded-xl bg-primary text-center py-2 text-xs font-bold text-primary-foreground shadow-xs"
                    >
                      Sign In / Join Campus
                    </Link>
                  </div>
                )}

                {/* Anonymity Mode Switcher (Rule 6 in AGENTS.md) */}
                <div className="rounded-2xl border border-border/40 bg-card/50 p-2.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <VenetianMask className="size-3 text-purple-400" />
                      Feed Anonymity Mode
                    </span>
                    <span className="text-[9px] font-bold text-primary">Live</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 bg-muted/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => toggleAnonMode("ALL")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer",
                        anonMode === "ALL"
                          ? "bg-card text-foreground shadow-xs border border-border/50"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <VenetianMask className="size-3.5 text-purple-400" />
                      <span>All &amp; Anon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAnonMode("NON_ANONYMOUS")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer",
                        anonMode === "NON_ANONYMOUS"
                          ? "bg-card text-foreground shadow-xs border border-border/50"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ShieldCheck className="size-3.5 text-emerald-400" />
                      <span>Public Only</span>
                    </button>
                  </div>
                </div>

                {/* All Navigation Options & Campus Hubs */}
                <div className="space-y-1 pt-1">
                  <span className="px-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
                    Campus Hubs &amp; Academics
                  </span>

                  <div className="space-y-0.5 pt-1">
                    {/* Home Feed */}
                    <Link
                      href="/app"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Home className="size-4.5 text-emerald-500" />
                        <span>Campus Feed</span>
                      </span>
                    </Link>

                    {/* Academics Vault - Prominently Displayed */}
                    <Link
                      href="/app/academics"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/academics")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <GraduationCap className="size-4.5 text-emerald-500" />
                        <span>Academics Vault</span>
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-500">
                        Notes &bull; PYQs
                      </span>
                    </Link>

                    {/* Communities & Clubs */}
                    <Link
                      href="/app/communities"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/communities")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Users className="size-4.5 text-blue-500" />
                        <span>Communities &amp; Clubs</span>
                      </span>
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-blue-500">
                        Sub-Hubs
                      </span>
                    </Link>

                    {/* Colleges Directory */}
                    <Link
                      href="/app/colleges"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/colleges")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <School className="size-4.5 text-amber-500" />
                        <span>Colleges Directory</span>
                      </span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                        1,350+
                      </span>
                    </Link>

                    {/* Events & Fests */}
                    <Link
                      href="/app/events"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/events")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Calendar className="size-4.5 text-rose-500" />
                        <span>Events &amp; Fests</span>
                      </span>
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-rose-500">
                        Live
                      </span>
                    </Link>

                    {/* Campus Match & Dating */}
                    <Link
                      href="/app/dating"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/dating")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Heart className="size-4.5 text-pink-500" />
                        <span>Campus Match</span>
                      </span>
                      <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-pink-500">
                        Dating
                      </span>
                    </Link>

                    {/* Confessions Wall */}
                    <Link
                      href="/app/confessions"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/confessions")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Flame className="size-4.5 text-orange-500" />
                        <span>Confessions Wall</span>
                      </span>
                      <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-orange-500">
                        Hot
                      </span>
                    </Link>

                    {/* Reels & Vibes */}
                    <Link
                      href="/app/reels"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/reels")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Video className="size-4.5 text-purple-500" />
                        <span>Reels &amp; Vibes</span>
                      </span>
                      <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-purple-400">
                        New
                      </span>
                    </Link>

                    {/* Campus Articles */}
                    <Link
                      href="/app/articles"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/articles")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <BookOpen className="size-4.5 text-teal-500" />
                        <span>Campus Articles</span>
                      </span>
                    </Link>

                    {/* Marketplace & Rentals */}
                    <Link
                      href="/app/marketplace"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/marketplace")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <ShoppingBag className="size-4.5 text-indigo-500" />
                        <span>Marketplace &amp; Rentals</span>
                      </span>
                      <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-indigo-400">
                        Beta
                      </span>
                    </Link>

                    {/* Gaming Arena */}
                    <Link
                      href="/app/gaming"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/gaming")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Gamepad2 className="size-4.5 text-yellow-500" />
                        <span>Gaming Arena</span>
                      </span>
                    </Link>

                    {/* Housing & Flats */}
                    <Link
                      href="/app/housing"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/housing")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Building2 className="size-4.5 text-slate-400" />
                        <span>Housing &amp; Flats</span>
                      </span>
                    </Link>

                    {/* Lost & Found */}
                    <Link
                      href="/app/lost-and-found"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/lost-and-found")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Search className="size-4.5 text-cyan-500" />
                        <span>Lost &amp; Found</span>
                      </span>
                    </Link>

                    {/* Birthdays */}
                    <Link
                      href="/app/birthdays"
                      onClick={() => setShowMobileDrawer(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isPathActive(pathname, "/app/birthdays")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Cake className="size-4.5 text-rose-400" />
                        <span>Birthdays</span>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Utilities */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <Link
                  href="/app/settings"
                  onClick={() => setShowMobileDrawer(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Settings className="size-4" />
                  <span>Settings &amp; Privacy</span>
                </Link>

                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-xs font-semibold text-muted-foreground">Dark / Light Mode</span>
                  <ThemeToggle className="size-8 rounded-xl border border-border/40 bg-card hover:bg-muted" />
                </div>

                {profile && (
                  <div className="pt-1">
                    <SignOutButton />
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CampusUnlockedModal isOpen={showUnlockModal} onClose={() => setShowUnlockModal(false)} />
      <DreamCampusesModal isOpen={showDreamModal} onClose={() => setShowDreamModal(false)} />
    </>
  );
}
