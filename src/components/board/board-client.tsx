"use client";

import Link from "next/link";
import { useEffect } from "react";
import { navPress } from "@/components/shells/nav-utils";
import { trackBoardView } from "@/lib/analytics/ga4";
import { cn } from "@/lib/utils";
import { BOARD_TABS, type BoardTab, boardHref } from "./board-tabs";
import { HousingPanel } from "./housing-panel";
import { LostFoundPanel } from "./lost-found-panel";
import { RidesPanel } from "./rides-panel";
import { SellPanel } from "./sell-panel";

interface BoardClientProps {
  tab: BoardTab;
  profileId: string;
  campusId?: string | null;
}

/** Campus board: one page for rides, rooms, lost and found, and buy and sell. */
export function BoardClient({ tab, profileId, campusId }: BoardClientProps) {
  useEffect(() => {
    trackBoardView(tab);
  }, [tab]);

  return (
    <div className="min-h-dvh pb-24">
      <div className="mx-auto max-w-5xl space-y-5 py-6">
        <header className="space-y-1">
          <h1 className="text-balance text-3xl text-fg">Campus board</h1>
          <p className="max-w-xl text-pretty text-sm text-fg-muted">
            Rides, rooms, lost things and stuff for sale, posted by students.
          </p>
        </header>

        <nav aria-label="Campus board">
          <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {BOARD_TABS.map((item) => {
              const active = item.id === tab;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={boardHref(item.id)}
                    scroll={false}
                    onClick={navPress}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-ui",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]",
                      active
                        ? "bg-brand text-brand-fg shadow-sticker"
                        : "bg-surface-muted text-fg-muted hover:bg-surface-sunken hover:text-fg"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {tab === "rides" && <RidesPanel profileId={profileId} />}
        {tab === "housing" && <HousingPanel profileId={profileId} />}
        {tab === "lost-found" && <LostFoundPanel profileId={profileId} campusId={campusId} />}
        {tab === "sell" && <SellPanel profileId={profileId} />}
      </div>
    </div>
  );
}
