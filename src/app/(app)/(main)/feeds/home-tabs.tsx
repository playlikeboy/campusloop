"use client";

import { Gamepad2, Ghost, Home, Users } from "lucide-react";
import Link from "next/link";
import { navPress } from "@/components/shells/nav-utils";
import { cn } from "@/lib/utils";

const HOME_TABS = [
  { id: "feed", href: "/feeds", label: "Feed", icon: Home },
  { id: "confessions", href: "/confessions", label: "Confessions", icon: Ghost },
  { id: "communities", href: "/communities", label: "Communities", icon: Users },
  { id: "play", href: "/play", label: "Play", icon: Gamepad2 },
] as const;

export type HomeTabId = (typeof HOME_TABS)[number]["id"];

/** Chip row at the top of Home: the feed, confessions, communities and Play live side by side. */
export function HomeTabs({ active, className }: { active: HomeTabId; className?: string }) {
  return (
    <nav aria-label="Home" className={cn("no-scrollbar flex gap-2 overflow-x-auto px-4 py-2", className)}>
      {HOME_TABS.map((tab) => {
        const selected = tab.id === active;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            prefetch
            onClick={navPress}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-ui",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.97]",
              selected
                ? "bg-brand text-brand-fg"
                : "bg-surface-muted text-fg-muted hover:bg-surface-sunken hover:text-fg"
            )}
          >
            <Icon className="hidden size-4 min-[400px]:block" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
