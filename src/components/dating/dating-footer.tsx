"use client";

import {
  Flame,
  Heart,
  Lock,
  MessageCircleHeart,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface ProfilesResponse {
  meta?: {
    likesYouCount?: number;
  };
}

export function DatingFooter() {
  const pathname = usePathname();

  const { data } = useSWR<ProfilesResponse>("/api/dating/profiles", {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });

  const likesYouCount = data?.meta?.likesYouCount ?? 0;

  const NAV_ITEMS = [
    {
      id: "discover",
      label: "Discover",
      href: "/dating",
      icon: Flame,
      isActive: pathname === "/dating" || pathname === "/dating/discover",
    },
    {
      id: "likes",
      label: "Likes",
      href: "/dating/likes",
      icon: Heart,
      isActive: pathname.startsWith("/dating/likes"),
      badge: likesYouCount > 0 ? (likesYouCount > 9 ? "9+" : likesYouCount) : null,
    },
    {
      id: "matches",
      label: "Matches",
      href: "/dating/matches",
      icon: MessageCircleHeart,
      isActive: pathname.startsWith("/dating/matches"),
    },
    {
      id: "crush",
      label: "Crush",
      href: "/dating/requests",
      icon: Lock,
      isActive: pathname.startsWith("/dating/requests") || pathname === "/crush",
    },
    {
      id: "settings",
      label: "Settings",
      href: "/dating/settings",
      icon: SlidersHorizontal,
      isActive: pathname.startsWith("/dating/settings") || pathname.startsWith("/dating/filters"),
    },
  ];

  return (
    <nav
      aria-label="Campus Match Navigation"
      className={cn(
        "fixed bottom-0 inset-x-0 z-40 select-none",
        "bg-background/90 backdrop-blur-xl border-t border-border/40 shadow-lg",
        "pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1.5",
        "sm:bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md",
        "sm:rounded-2xl sm:border sm:border-border/60 sm:shadow-2xl sm:pb-1.5 sm:pt-1.5"
      )}
    >
      <div className="flex items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 py-1 px-1.5 min-h-[46px] rounded-xl transition-all cursor-pointer active:scale-92",
                active
                  ? "text-pink-600 dark:text-pink-400 font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Icon Container with Badge */}
              <div className="relative">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-xl transition-all",
                    active && "bg-pink-500/10 dark:bg-pink-500/15"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4.5 transition-transform",
                      active && "scale-105",
                      active && item.id === "likes" && "fill-pink-500 text-pink-500",
                      active && item.id === "discover" && "fill-pink-500 text-pink-500"
                    )}
                  />
                </div>

                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-pink-600 px-1 text-[9px] font-black text-white ring-2 ring-background animate-in zoom-in-50">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] tracking-tight transition-colors mt-0.5",
                  active ? "font-black text-pink-600 dark:text-pink-400" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
