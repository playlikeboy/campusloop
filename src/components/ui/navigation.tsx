"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  GraduationCap,
  Home,
  MoreHorizontal,
  Plus,
  School,
  UserCircle,
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

const HIDE_GLOBAL_MOBILE_NAV = [
  "/app/chat/",
  "/app/stories/new",
  "/app/story/",
  "/app/post/new",
  "/app/post/",
  "/app/college/",
  "/app/community/",
  "/app/communities/",
  "/app/academics/",
  "/app/academics/upload",
  "/app/search",
  "/app/settings",
  "/app/dating",
  "/app/matching",
  "/app/notifications",
  "/@",
  "/app/more",
];

function isMobileFlow(pathname: string) {
  return HIDE_GLOBAL_MOBILE_NAV.some((prefix) => pathname.startsWith(prefix));
}

export function Navigation({ profile, collegeName, isViewer }: NavigationProps) {
  const pathname = usePathname() || "/app";
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showDreamModal, setShowDreamModal] = useState(false);
  const unreadNotificationsCount = useUnreadNotificationsCount();

  useEffect(() => {
    setShowProfileMenu(false);
  }, [pathname]);

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
      {/* Desktop navigation stays feature-rich; mobile has a deliberately separate shell. */}
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
                  pathname.startsWith("/app/chat")
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
                  pathname.startsWith("/app/notifications")
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
              const isActive =
                pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));

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

      {/* Mobile: one and only one global navigation system. */}
      {!isMobileFlow(pathname) && (
        <nav
          aria-label="Main mobile navigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/35 bg-background/96 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-6px_18px_rgba(70,60,130,0.05)] backdrop-blur-2xl md:hidden"
        >
          <div
            className={cn(
              "mx-auto grid h-[64px] w-full max-w-md items-stretch px-1",
              mobileBottomItems.length === 5 ? "grid-cols-5" : "grid-cols-4"
            )}
          >
            {mobileBottomItems.map((item) => {
              const Icon = item.href === "/app" ? Home : item.href === "/app/discover" ? Compass : item.href === "/app/chat" ? AnimateMessageSquare : item.icon;
              const isCreate = item.href === "/app/post/new";
              const isActive =
                pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
              const isExploreActive =
                item.href === "/app/discover" &&
                (pathname.startsWith("/app/communities") ||
                  pathname.startsWith("/app/confessions") ||
                  pathname.startsWith("/app/academics") ||
                  pathname.startsWith("/app/events") ||
                  pathname.startsWith("/app/reels") ||
                  pathname.startsWith("/app/articles") ||
                  pathname.startsWith("/app/colleges"));

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
                    className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-primary"
                    aria-label="Create content"
                  >
                    <span className="grid size-10 place-items-center rounded-full bg-primary text-white shadow-[0_5px_16px_rgba(0,210,133,0.25)] ring-2 ring-background transition-transform active:scale-95">
                      <Plus className="size-5.5" strokeWidth={2.5} />
                    </span>
                    <span className="text-[10px] font-bold leading-none">Create</span>
                  </Link>
                );
              }

              const active = isActive || isExploreActive;

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
                    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="relative grid size-7 place-items-center">
                    {typeof Icon === "function" ? (
                      Icon === Home || Icon === Compass ? (
                        <Icon className={cn("size-5.25", active && "stroke-[2.5]")} />
                      ) : (
                        <AnimatedIcon
                          icon={Icon}
                          animation="pop"
                          size={20}
                          strokeWidth={active ? 2.5 : 2}
                          animateOnHover={false}
                          playKey={active}
                        />
                      )
                    ) : null}
                    {item.href === "/app/chat" && unreadNotificationsCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-rose-500 ring-2 ring-background" />
                    )}
                  </span>
                  <span className={cn("truncate text-[10px] leading-none", active ? "font-bold" : "font-medium")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <CampusUnlockedModal isOpen={showUnlockModal} onClose={() => setShowUnlockModal(false)} />
      <DreamCampusesModal isOpen={showDreamModal} onClose={() => setShowDreamModal(false)} />
    </>
  );
}
