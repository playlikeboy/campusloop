"use client";

import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest } from "@/lib/api";
import type { getDpState } from "@/lib/play/server/dp";
import { cn } from "@/lib/utils";
import { announceBadges } from "../play-ui";

type DpState = Awaited<ReturnType<typeof getDpState>>;

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-surface-muted px-3 py-2">
      <dt className="text-xs font-semibold text-fg-muted">{label}</dt>
      <dd className="text-lg font-bold tabular-nums text-fg">{value}</dd>
    </div>
  );
}

/** Your entry: opt in with an explicit confirm, see your record, withdraw any time. */
export function DpEntryCard({ state, onChange }: { state: DpState; onChange: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const entry = state.myEntry;

  async function enter() {
    setBusy(true);
    try {
      const res = await apiRequest<{ newBadges?: Array<{ title: string; lp: number }> }>("/api/play/dp", "POST", {
        confirm: true,
      });
      toast.success("You're in. Your DP is now in this week's battle.");
      announceBadges(res.newBadges);
      setAgreed(false);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't enter. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    setBusy(true);
    try {
      await apiRequest("/api/play/dp", "DELETE");
      toast.success("Withdrawn. Your DP is no longer shown.");
      setConfirmWithdraw(false);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't withdraw. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (entry?.status === "HIDDEN") {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-fg">
        Your entry was hidden after reports from other students. You can enter again next week.
      </div>
    );
  }

  if (entry?.status === "ACTIVE") {
    const played = entry.wins + entry.losses;
    return (
      <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- your own DP snapshot */}
          <img src={entry.imageUrl} alt="Your DP in this week's battle" className="size-20 shrink-0 rounded-md object-cover" />
          <div className="min-w-0 space-y-1">
            <p className="text-lg font-bold text-fg">You're in this week</p>
            <p className="text-sm text-fg-muted">
              {entry.rank
                ? `Campus rank #${entry.rank}`
                : `Ranked after ${state.minBattles} battles (${Math.min(played, state.minBattles)}/${state.minBattles})`}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-2">
          <Stat label="Rating" value={entry.rating} />
          <Stat label="Wins" value={entry.wins} />
          <Stat label="Losses" value={entry.losses} />
        </dl>
        <Button variant="outline" onClick={() => setConfirmWithdraw(true)} disabled={busy}>
          Withdraw my DP
        </Button>
        <ConfirmDialog
          isOpen={confirmWithdraw}
          title="Withdraw your DP?"
          description="It stops showing right away. Entering again this week starts your rating from zero."
          confirmText="Withdraw"
          variant="warning"
          isLoading={busy}
          onConfirm={withdraw}
          onClose={() => setConfirmWithdraw(false)}
        />
      </div>
    );
  }

  if (!state.canEnter) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <p className="text-base font-semibold text-fg">Add a profile photo to enter</p>
        <p className="text-sm text-fg-muted">The DP Battle uses the photo on your profile. Add one, then come back.</p>
        <Button asChild variant="secondary">
          <Link href="/profile/edit">Edit profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- your own current DP */}
        <img src={state.myAvatarUrl ?? ""} alt="Your current profile photo" className="size-20 shrink-0 rounded-md object-cover" />
        <ul className="min-w-0 space-y-1.5 text-sm text-fg">
          <li className="flex gap-2">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-verified-text" />
            Only students at your college see it.
          </li>
          <li className="flex gap-2">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-verified-text" />
            Nobody sees who voted for what.
          </li>
          <li className="flex gap-2">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-verified-text" />
            Withdraw any time. It ends on Sunday night.
          </li>
        </ul>
      </div>
      <label
        className={cn(
          "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-ui",
          agreed ? "border-brand bg-brand-subtle text-brand-text" : "border-border-strong text-fg"
        )}
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="size-5 shrink-0 accent-brand"
        />
        I want to enter this photo in this week's DP Battle.
      </label>
      <Button onClick={enter} disabled={!agreed} loading={busy} size="lg" className="w-full sm:w-auto">
        <Check aria-hidden="true" />
        {entry?.status === "WITHDRAWN" ? "Enter again" : "Enter my DP"}
      </Button>
    </div>
  );
}
