"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import type { InviteLeader } from "@/lib/referrals/leaderboard";
import { cn } from "@/lib/utils";
import { InviteCard } from "./invite-card";

type Scope = "campus" | "all";

interface LeaderboardResponse {
  scope: Scope;
  leaders: InviteLeader[];
  me: { username: string; invites: number };
}

const SCOPES: { value: Scope; label: string }[] = [
  { value: "campus", label: "My college" },
  { value: "all", label: "All colleges" },
];

export function InviteLeaderboard() {
  const [scope, setScope] = useState<Scope>("campus");
  const { data, isLoading, error } = useSWR<LeaderboardResponse>(
    `/api/invites/leaderboard?scope=${scope}`,
    fetcher,
    { keepPreviousData: true, dedupingInterval: 30_000 }
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl text-fg">Top inviters</h1>
        <p className="text-sm text-fg-muted">
          Students who brought the most friends. An invite counts when your friend joins with a college email.
        </p>
      </header>

      <InviteCard />

      <SegmentedControl
        options={SCOPES}
        value={scope}
        onChange={setScope}
        fullWidth
        aria-label="Leaderboard"
      />

      {isLoading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => `row-${i}`).map((key) => (
            <Skeleton key={key} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Trophy}
          title="Could not load the leaderboard"
          description="Try again in a minute."
        />
      ) : !data?.leaders.length ? (
        <EmptyState
          icon={Trophy}
          title="Nobody is on the board yet"
          description="Send your link to one friend and you take first place."
        />
      ) : (
        <ol className="divide-y divide-border rounded-lg border border-border bg-surface">
          {data.leaders.map((leader) => (
            <LeaderRow key={leader.username} leader={leader} isMe={leader.username === data.me.username} />
          ))}
        </ol>
      )}
    </div>
  );
}

function LeaderRow({ leader, isMe }: { leader: InviteLeader; isMe: boolean }) {
  return (
    <li className={cn("flex items-center gap-3 px-4 py-3", isMe && "bg-brand-subtle")}>
      <span
        className={cn(
          "w-7 shrink-0 text-center text-sm font-bold tabular-nums",
          leader.rank <= 3 ? "text-reward-text" : "text-fg-muted"
        )}
      >
        {leader.rank}
      </span>
      <Avatar size="sm">
        {leader.avatarUrl ? <AvatarImage src={leader.avatarUrl} alt="" /> : null}
        <AvatarFallback>{leader.displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <Link href={`/${leader.username}`} className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-fg">
          {leader.displayName}
          {isMe ? " (you)" : ""}
        </span>
        <span className="block truncate text-xs text-fg-muted">
          {leader.college ?? `@${leader.username}`}
        </span>
      </Link>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
        {leader.invites}
        <span className="ml-1 font-normal text-fg-muted">{leader.invites === 1 ? "invite" : "invites"}</span>
      </span>
    </li>
  );
}
