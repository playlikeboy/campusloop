"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import type { getBranchWars } from "@/lib/play/server/branch-wars";
import { normalizeBranch } from "@/lib/play/scoring";
import { cn } from "@/lib/utils";
import { PlayHeader, PlaySection, RankTile, timeLeft } from "./play-ui";

type BranchWars = Awaited<ReturnType<typeof getBranchWars>> & { week: string; isLastWeek: boolean; endsAt: number };

/** /play/branch-wars: this week's (or last week's) branch table at your college. */
export function BranchWarsClient() {
  const [which, setWhich] = useState<"this" | "last">("this");
  const { data, error, isLoading, mutate } = useSWR<BranchWars>(
    `/api/play/branch-wars${which === "last" ? "?week=last" : ""}`,
    fetcher
  );
  const mine = normalizeBranch(data?.myBranch);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-10">
      <PlayHeader title="Branch Wars" description="Every point you score in Play counts for your branch. Top branch at your college wins the week." />

      <PlaySection
        title={which === "this" ? "This week" : "Last week"}
        id="branch-table"
        aside={
          <SegmentedControl
            size="sm"
            aria-label="Which week"
            value={which}
            onChange={setWhich}
            options={[
              { value: "this", label: "This week" },
              { value: "last", label: "Last week" },
            ]}
          />
        }
      >
        {isLoading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : error || !data ? (
          <EmptyState bordered title="Couldn't load the table" action={<Button onClick={() => void mutate()}>Try again</Button>} />
        ) : data.rows.length === 0 ? (
          <EmptyState
            bordered
            icon={Users}
            title="No points yet"
            description="Play a quiz, a poll or a battle to put your branch on the board."
          />
        ) : (
          <>
            {which === "this" && <p className="text-sm text-fg-muted">Ends in {timeLeft(data.endsAt)}.</p>}
            <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
              {data.rows.map((r) => (
                <li
                  key={r.branch}
                  className={cn(
                    "flex min-h-14 items-center gap-3 px-4 py-2",
                    mine && normalizeBranch(r.branch) === mine && "bg-brand-subtle"
                  )}
                >
                  <RankTile rank={r.rank} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold break-words text-fg">{r.branch}</span>
                    <span className="block text-sm tabular-nums text-fg-muted">
                      {r.players} {r.players === 1 ? "player" : "players"}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums text-fg">{r.points}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </PlaySection>

      {data && (
        <PlaySection title="You" id="branch-you">
          {data.myBranch ? (
            <p className="text-base text-fg">
              {data.myBranch}
              {data.myBranchRank ? ` is #${data.myBranchRank}` : " has no points yet"}. You added{" "}
              <span className="font-bold tabular-nums">{data.myPoints}</span> points.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-base text-fg">Add your branch to your profile so your points count.</p>
              <Button asChild variant="secondary">
                <Link href="/profile/edit">Edit profile</Link>
              </Button>
            </div>
          )}
        </PlaySection>
      )}

      {data && (
        <PlaySection title="How points work" id="branch-how">
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface text-sm">
            {[
              ["Right answer in the daily quiz", data.rules.TRIVIA_CORRECT],
              [`This or That pick (up to ${data.rules.TOT_WEEKLY_CAP} a week)`, data.rules.TOT_PICK],
              ["Posting a meme in Meme War", data.rules.MEME_POSTED],
              ["Each upvote on your meme", data.rules.MEME_UPVOTE],
              ["Each DP Battle win", data.rules.DP_WIN],
            ].map(([label, pts]) => (
              <li key={label as string} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-fg">{label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-fg">+{pts}</span>
              </li>
            ))}
          </ul>
        </PlaySection>
      )}
    </div>
  );
}
