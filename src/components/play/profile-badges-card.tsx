"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { ACHIEVEMENTS_BY_KEY, PLAY_ROUTES } from "@/constants/play";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";
import { type AchievementsResponse, groupEarned } from "./achievements-client";
import { ACHIEVEMENT_ICONS } from "./play-ui";

/** Play badges on the profile Points tab. Hidden when there is nothing to show on someone else's profile. */
export function ProfileBadgesCard({
  profileId,
  isOwnProfile,
  className,
}: {
  profileId: string;
  isOwnProfile: boolean;
  className?: string;
}) {
  const url = isOwnProfile ? "/api/play/achievements?sync=0" : `/api/play/achievements?profileId=${encodeURIComponent(profileId)}`;
  const { data } = useSWR<AchievementsResponse>(url, fetcher, { revalidateOnFocus: false });
  if (!data) return null;

  const counts = groupEarned(data.earned);
  const keys = [...counts.keys()].filter((k) => ACHIEVEMENTS_BY_KEY[k]);
  if (!isOwnProfile && keys.length === 0) return null;

  return (
    <section className={cn("space-y-3 rounded-lg border border-border bg-surface p-4", className)} aria-labelledby="play-badges-title">
      <div>
        <h2 id="play-badges-title" className="text-lg text-fg">
          Play badges
        </h2>
        <p className="text-sm text-fg-muted">
          {keys.length ? `${keys.length} earned` : "Win a game in Play to earn your first badge."}
        </p>
      </div>
      {keys.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {keys.slice(0, 8).map((k) => {
            const def = ACHIEVEMENTS_BY_KEY[k];
            const Icon = ACHIEVEMENT_ICONS[def.icon];
            return (
              <li
                key={k}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-reward-subtle px-3 text-sm font-semibold text-reward-text"
              >
                <Icon aria-hidden="true" className="size-4" />
                {def.title}
              </li>
            );
          })}
        </ul>
      )}
      {isOwnProfile && (
        <Link
          href={PLAY_ROUTES.achievements}
          className="flex min-h-11 items-center justify-between rounded-md text-sm font-semibold text-brand-text outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {keys.length ? "See and share your badges" : "Go to Play"}
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </section>
  );
}
