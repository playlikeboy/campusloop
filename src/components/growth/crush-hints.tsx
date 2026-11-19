"use client";

import { Eye, Lock, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoopPointsSticker } from "@/components/ui/stickers";
import { trackGrowthUnlock } from "@/lib/analytics/ga4";
import { fetcher } from "@/lib/api";

interface HintsResponse {
  received: number;
  unlocked: boolean;
  unlockedVia: "invites" | "points" | null;
  invites: number;
  invitesNeeded: number;
  cost: number;
  points: number;
  hints: { year: number | null; branch: string | null }[];
}

function hintLabel(h: { year: number | null; branch: string | null }) {
  const parts = [h.year ? `Year ${h.year}` : null, h.branch].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No year or branch on their profile";
}

/**
 * Who added you, without names. The count is always real. Year and branch
 * unlock with accepted invites or Loop Points; names are never shown.
 */
export function CrushHints() {
  const { data, isLoading, mutate } = useSWR<HintsResponse>("/api/dating/crush/hints", fetcher);
  const [buying, setBuying] = useState(false);

  if (isLoading && !data) return <Skeleton className="h-36 w-full rounded-lg" />;
  if (!data || data.received === 0) return null;

  async function unlockWithPoints() {
    setBuying(true);
    try {
      const res = await fetch("/api/dating/crush/hints", { method: "POST" });
      const body = (await res.json().catch(() => null)) as (HintsResponse & { error?: string }) | null;
      if (!res.ok || !body) {
        toast.error(body?.error ?? "Couldn't unlock hints.");
        return;
      }
      trackGrowthUnlock("crush_hints", "points");
      await mutate(body, { revalidate: false });
    } finally {
      setBuying(false);
    }
  }

  const invitesLeft = Math.max(0, data.invitesNeeded - data.invites);
  const canAfford = data.points >= data.cost;

  return (
    <section className="space-y-4 rounded-lg border border-border bg-surface p-4" aria-labelledby="hints-title">
      <div className="space-y-1">
        <h2 id="hints-title" className="text-lg text-fg">
          Hints about who added you
        </h2>
        <p className="text-sm text-fg-muted">
          {data.received} {data.received === 1 ? "student has" : "students have"} you in their Secret Crush. You
          see their year and branch, never their name.
        </p>
      </div>

      {data.unlocked ? (
        <ul className="flex flex-wrap gap-2">
          {data.hints.map((h, i) => (
            <li
              // Hints carry no id on purpose; the order is shuffled on every load.
              // biome-ignore lint/suspicious/noArrayIndexKey: anonymous hints have no stable id
              key={i}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-crush-subtle px-3.5 text-sm font-semibold text-crush-text"
            >
              <Eye className="size-4" aria-hidden="true" />
              {hintLabel(h)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-3">
          <ul className="flex flex-wrap gap-2" aria-hidden="true">
            {Array.from({ length: Math.min(data.received, 5) }, (_, i) => `locked-${i}`).map((k) => (
              <li
                key={k}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-muted px-3.5 text-sm text-fg-subtle"
              >
                <Lock className="size-4" />
                Year ? · Branch ?
              </li>
            ))}
          </ul>
          <p className="text-sm text-fg">
            Unlock by inviting {data.invitesNeeded} friends who join with their college email
            {invitesLeft < data.invitesNeeded ? ` (${invitesLeft} to go)` : ""}, or once for {data.cost} Loop
            Points.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href="/invites">
                <UserPlus aria-hidden="true" />
                Invite friends
              </Link>
            </Button>
            <Button variant="outline" onClick={unlockWithPoints} loading={buying} disabled={!canAfford}>
              Unlock for {data.cost} LP
            </Button>
            <LoopPointsSticker points={data.points} label="LP" size="sm" />
          </div>
        </div>
      )}
    </section>
  );
}
