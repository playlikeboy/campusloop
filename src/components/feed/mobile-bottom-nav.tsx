"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatedIcon, type IconMotionName } from "@/components/ui/animated-icon";
import { MOBILE_BOTTOM_ITEMS } from "@/constants/navigation";
import type { UserProfile } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  profile?: UserProfile;
  isViewer?: boolean;
}

const HIDE_GLOBAL_MOBILE_NAV = [
  "/chat/",
  "/stories/new",
  "/story/",
  "/post/",
  "/academics/study-material/upload",
];

function isMobileFlow(pathname: string) {
  return HIDE_GLOBAL_MOBILE_NAV.some((prefix) => pathname.startsWith(prefix));
}

function isPathActive(currentPath: string, targetHref: string) {
  if (targetHref === "/feeds") return currentPath === "/feeds" || currentPath === "/";
  if (targetHref === "/chat") return currentPath === "/chat" || currentPath.startsWith("/chat/");
  if (targetHref === "/colleges") return currentPath === "/colleges" || currentPath.startsWith("/colleges/");
  if (targetHref === "/matching") return currentPath === "/matching" || currentPath.startsWith("/matching/");
  return currentPath === targetHref || currentPath.startsWith(`${targetHref}/`);
}

const mobileIconAnimations: Record<string, IconMotionName> = {
  "/feeds": "lift",
  "/colleges": "lift",
  "/post/new": "pop",
  "/chat": "beat",
  "/matching": "beat",
  "/profile": "pop",
};

export function MobileBottomNav({ profile, isViewer }: MobileBottomNavProps) {
  const pathname = usePathname() || "/feeds";
  const [mobileNavPulse, setMobileNavPulse] = useState<{ href: string; key: number } | null>(null);

  const handleMobileNavPress = (href: string) => {
    sounds.tap();
    haptics.light();
    setMobileNavPulse((prev) => ({ href, key: (prev?.key ?? 0) + 1 }));
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

  if (isMobileFlow(pathname)) {
    return null;
  }

  return (
    <nav
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-40",
        "w-[calc(100%-24px)] max-w-[420px] h-[62px]",
        "bottom-[max(10px,env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)]",
        "grid items-center justify-items-center",
        mobileBottomItems.length === 5
          ? "grid-cols-5"
          : mobileBottomItems.length === 4
            ? "grid-cols-4"
            : "grid-cols-3",
        "rounded-[22px] border border-border/50 bg-card/95 p-1",
        "shadow-[0_12px_36px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.06)]",
        "backdrop-blur-2xl md:hidden select-none"
      )}
      aria-label="Mobile bottom navigation"
    >
      {mobileBottomItems.map((item) => {
        const Icon = item.icon;
        const isActive = isPathActive(pathname, item.href);
        const animation = mobileIconAnimations[item.href] ?? "pop";
        const playKey =
          mobileNavPulse?.href === item.href ? mobileNavPulse.key : undefined;

        if (item.href === "/post/new") {
          return (
            <Link
              key="post-create"
              href="/post/new"
              prefetch
              onClick={() => handleMobileNavPress(item.href)}
              className="mobile-nav-item mobile-nav-create group min-h-[44px] min-w-[44px] flex flex-col items-center justify-center"
              aria-label="Create new campus post"
            >
              <span className="mobile-nav-icon mobile-nav-create-icon" aria-hidden="true">
                <AnimatedIcon
                  icon={Icon}
                  animation="pop"
                  size={20}
                  strokeWidth={2.4}
                  animateOnHover={false}
                  playKey={playKey}
                  className="size-full"
                />
              </span>
              <span className="mobile-nav-label">Create</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={() => handleMobileNavPress(item.href)}
            className={cn(
              "mobile-nav-item min-h-[44px] min-w-[44px] flex flex-col items-center justify-center",
              isActive && "mobile-nav-item-active"
            )}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="mobile-nav-icon" aria-hidden="true">
              <AnimatedIcon
                icon={Icon}
                animation={animation}
                size={21}
                strokeWidth={isActive ? 2.2 : 1.8}
                animateOnHover={false}
                playKey={playKey}
                className="size-full"
              />
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
