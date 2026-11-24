"use client";

import { Trophy } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import type { getDpState } from "@/lib/play/server/dp";
import { PlayHeader, PlaySection, timeLeft } from "../play-ui";
import { DpArena } from "./dp-arena";
import { DpEntryCard } from "./dp-entry-card";
import { DpLeaderboard } from "./dp-leaderboard";

type DpState = Awaited<ReturnType<typeof getDpState>>;

/** /play/dp-battle: vote, your entry, this week's table and last week's top 3. */
export function DpBattleClient() {
  const { data, error, isLoading, mutate } = useSWR<DpState>("/api/play/dp", fetcher);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-10">
      <PlayHeader
        title="DP Battle"
        description="Two DPs from your college. Tap the better one. Only students who entered are ever shown."
      />

      <PlaySection
        title="Better DP?"
        id="dp-vote"
        aside={data ? <span className="text-sm text-fg-muted">Ends in {timeLeft(data.endsAt)}</span> : null}
      >
        <DpArena onVoted={() => void mutate()} />
      </PlaySection>

      <PlaySection title="Your entry" id="dp-entry">
        {isLoading ? (
          <Skeleton className="h-44 rounded-lg" />
        ) : error || !data ? (
          <EmptyState
            bordered
            size="compact"
            title="Couldn't load your entry"
            action={<Button onClick={() => void mutate()}>Try again</Button>}
          />
        ) : (
          <DpEntryCard state={data} onChange={() => void mutate()} />
        )}
      </PlaySection>

      {data && (
        <PlaySection
          title="This week's top DPs"
          id="dp-top"
          aside={<span className="text-sm tabular-nums text-fg-muted">{data.entrants} entered</span>}
        >
          {data.leaderboard.length ? (
            <DpLeaderboard rows={data.leaderboard} />
          ) : (
            <EmptyState
              bordered
              size="compact"
              icon={Trophy}
              title="No ranks yet"
              description={`A DP gets ranked after ${data.minBattles} battles.`}
            />
          )}
        </PlaySection>
      )}

      {data && data.lastWeek.length > 0 && (
        <PlaySection title="Last week's top 3" id="dp-last">
          <DpLeaderboard rows={data.lastWeek} compact />
        </PlaySection>
      )}

      <PlaySection title="How it works" id="dp-how">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg">
          <li>You pick which DP looks better as a photo. It's about the picture, not the person.</li>
          <li>Ratings move like chess ratings: beating a higher-rated DP earns more.</li>
          <li>Each week starts fresh on Monday. You enter again each week if you want to.</li>
          <li>Report anything that isn't someone's own photo or breaks the rules. Three reports hide it.</li>
        </ul>
      </PlaySection>
    </div>
  );
}
