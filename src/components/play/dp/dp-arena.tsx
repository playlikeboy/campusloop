"use client";

import { RefreshCw, Swords } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import type { DpPair } from "@/lib/play/server/dp";
import { PlayReportButton } from "../report-button";

type PairResponse = { pair: DpPair | null; reason?: "not_enough" | "all_done" };

/** Two opted-in DPs side by side. Tap the better one; the next pair loads. */
export function DpArena({ onVoted }: { onVoted?: () => void }) {
  const { data, isLoading, mutate } = useSWR<PairResponse>("/api/play/dp/pair", fetcher, {
    revalidateOnFocus: false,
  });
  const [sending, setSending] = useState<string | null>(null);

  async function vote(winnerId: string, loserId: string) {
    if (sending) return;
    setSending(winnerId);
    haptics.light();
    try {
      const res = await fetch("/api/play/dp/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId, loserId }),
      });
      const body = (await res.json().catch(() => ({}))) as PairResponse & { error?: string };
      if (!res.ok && body.error) toast.message(body.error);
      await mutate({ pair: body.pair ?? null, reason: body.reason }, { revalidate: false });
      onVoted?.();
    } catch {
      toast.error("Couldn't save your pick. Check your connection.");
    } finally {
      setSending(null);
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3" aria-busy="true">
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
      </div>
    );
  }

  if (!data?.pair) {
    return (
      <EmptyState
        bordered
        icon={Swords}
        title={data?.reason === "all_done" ? "You've judged every pair" : "Not enough DPs yet"}
        description={
          data?.reason === "all_done"
            ? "Check back later as more students enter."
            : "Battles start once a few more students at your college enter."
        }
        action={
          <Button variant="secondary" onClick={() => void mutate()}>
            <RefreshCw aria-hidden="true" />
            Check again
          </Button>
        }
      />
    );
  }

  const { a, b } = data.pair;
  const sides = [
    { me: a, other: b, label: "Left" },
    { me: b, other: a, label: "Right" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {sides.map(({ me, other, label }) => (
          <div key={me.entryId} className="space-y-1">
            <button
              type="button"
              onClick={() => void vote(me.entryId, other.entryId)}
              disabled={Boolean(sending)}
              aria-label={`${label} DP is better`}
              className="group relative block aspect-square w-full overflow-hidden rounded-lg border border-border bg-surface-muted transition-ui outline-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- user DP from an allowed host */}
              <img src={me.imageUrl} alt="" className="size-full object-cover" loading="eager" />
              {sending === me.entryId && <span className="absolute inset-0 bg-brand/20" aria-hidden="true" />}
            </button>
            <div className="flex items-center justify-between">
              <span className="pl-1 text-sm font-semibold text-fg-muted">{label}</span>
              <PlayReportButton
                targetType="DP_ENTRY"
                targetId={me.entryId}
                label={`Report the ${label.toLowerCase()} DP`}
                onReported={() => void mutate()}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => void mutate()} disabled={Boolean(sending)}>
          Skip this pair
        </Button>
      </div>
    </div>
  );
}
