"use client";

import { Flame, Heart, Lock, MessageCircleHeart, ShieldCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { formatCount } from "./nav-utils";

interface ProfilesResponse {
  meta?: { likesYouCount?: number };
}

const TABS = [
  {
    href: "/matching",
    label: "Discover",
    icon: Flame,
    match: (p: string) => p === "/matching" || p === "/matching/discover",
  },
  {
    href: "/matching/likes",
    label: "Likes",
    icon: Heart,
    match: (p: string) => p.startsWith("/matching/likes"),
  },
  {
    href: "/matching/matches",
    label: "Matches",
    icon: MessageCircleHeart,
    match: (p: string) => p.startsWith("/matching/matches"),
  },
  {
    href: "/matching/requests",
    label: "Crush",
    icon: Lock,
    match: (p: string) => p.startsWith("/matching/requests"),
  },
  {
    href: "/matching/settings",
    label: "Settings",
    icon: SlidersHorizontal,
    match: (p: string) => p.startsWith("/matching/settings") || p.startsWith("/matching/filters"),
  },
];

/** Campus Match section tabs under the app top bar. Crush pink is fenced to this surface. */
export function MatchSubHeader({ collegeName }: { collegeName?: string }) {
  const pathname = usePathname() || "/matching";
  const { data } = useSWR<ProfilesResponse>("/api/dating/profiles", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });
  const likesYouCount = data?.meta?.likesYouCount ?? 0;

  return (
    <div className="mb-4 border-b border-border">
      <div className="pt-4 pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="shrink-0 text-2xl text-fg">Campus Match</h1>
          {collegeName && <p className="min-w-0 truncate text-sm text-fg-muted">{collegeName}</p>}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
          <ShieldCheck className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          18+ only. Only signed-in students see your profile.
        </p>
      </div>
      <nav aria-label="Campus Match" className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          const showCount = tab.href === "/matching/likes" && likesYouCount > 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-crush text-crush-text" : "border-transparent text-fg-muted hover:text-fg"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{tab.label}</span>
              {showCount && (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-crush px-1.5 text-xs font-semibold tabular-nums text-crush-fg"
                  aria-label={`${likesYouCount} new likes`}
                >
                  {formatCount(likesYouCount)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
