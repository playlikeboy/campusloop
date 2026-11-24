"use client";

import { Lock, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ACHIEVEMENTS, type AchievementDef } from "@/constants/play";
import { useProfile } from "@/hooks/use-profile";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";
import { sharePlayImage } from "./play-share-image";
import { ACHIEVEMENT_ICONS, announceBadges, PlayHeader, PlaySection } from "./play-ui";

export interface EarnedRow {
  key: string;
  context: string;
  pointsAwarded: number;
  awardedAt: string;
}

export interface AchievementsResponse {
  earned: EarnedRow[];
  newBadges: Array<{ title: string; lp: number }>;
  isOwn?: boolean;
}

/** Earned badges grouped by key: how many times and when last. */
export function groupEarned(earned: EarnedRow[]) {
  const map = new Map<string, { times: number; last: string }>();
  for (const e of earned) {
    const cur = map.get(e.key);
    map.set(e.key, { times: (cur?.times ?? 0) + 1, last: cur && cur.last > e.awardedAt ? cur.last : e.awardedAt });
  }
  return map;
}

function BadgeRow({
  def,
  times,
  onShare,
}: {
  def: AchievementDef;
  times: number;
  onShare?: () => void;
}) {
  const Icon = ACHIEVEMENT_ICONS[def.icon];
  const earned = times > 0;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-md",
          earned ? "bg-reward text-reward-fg" : "bg-surface-muted text-fg-subtle"
        )}
      >
        {earned ? <Icon aria-hidden="true" className="size-6" /> : <Lock aria-hidden="true" className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-base leading-snug font-bold", earned ? "text-fg" : "text-fg-muted")}>
          {def.title}
          {times > 1 && <span className="font-semibold tabular-nums text-fg-muted"> x{times}</span>}
        </span>
        <span className="block text-sm text-fg-muted">
          {def.description}
          {!earned && <span className="text-reward-text"> · +{def.lp} LP</span>}
        </span>
      </span>
      {earned && onShare && (
        <Button variant="secondary" size="icon" aria-label={`Share ${def.title}`} onClick={onShare}>
          <Share2 aria-hidden="true" />
        </Button>
      )}
    </li>
  );
}

/** /play/achievements: every badge, earned first, each with a Share button. */
export function AchievementsClient() {
  const { data, error, isLoading, mutate } = useSWR<AchievementsResponse>("/api/play/achievements", fetcher, {
    revalidateOnFocus: false,
  });
  const { profile } = useProfile();
  const [announced, setAnnounced] = useState(false);

  useEffect(() => {
    if (data && !announced) {
      announceBadges(data.newBadges);
      setAnnounced(true);
    }
  }, [data, announced]);

  const counts = groupEarned(data?.earned ?? []);
  const earned = ACHIEVEMENTS.filter((a) => counts.has(a.key));
  const locked = ACHIEVEMENTS.filter((a) => !counts.has(a.key));
  const lp = (data?.earned ?? []).reduce((n, e) => n + e.pointsAwarded, 0);

  function share(def: AchievementDef) {
    void sharePlayImage(
      {
        kicker: "Badge unlocked",
        title: def.title,
        detail: def.description,
        name: profile?.displayName ?? "Me",
        college: profile?.institution?.name ?? null,
      },
      `campusloop-${def.key}.png`
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-10">
      <PlayHeader
        title="Your badges"
        description={
          data ? `${earned.length} of ${ACHIEVEMENTS.length} earned · ${lp} Loop Points from Play` : "Win games to earn badges and Loop Points."
        }
      />

      {isLoading ? (
        <Skeleton className="h-72 rounded-lg" />
      ) : error || !data ? (
        <EmptyState bordered title="Couldn't load badges" action={<Button onClick={() => void mutate()}>Try again</Button>} />
      ) : (
        <>
          <PlaySection title="Earned" id="badges-earned">
            {earned.length ? (
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                {earned.map((def) => (
                  <BadgeRow key={def.key} def={def} times={counts.get(def.key)?.times ?? 0} onShare={() => share(def)} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-muted">No badges yet. The daily quiz is the quickest first one.</p>
            )}
          </PlaySection>
          {locked.length > 0 && (
            <PlaySection title="Still to win" id="badges-locked">
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                {locked.map((def) => (
                  <BadgeRow key={def.key} def={def} times={0} />
                ))}
              </ul>
            </PlaySection>
          )}
        </>
      )}
    </div>
  );
}
