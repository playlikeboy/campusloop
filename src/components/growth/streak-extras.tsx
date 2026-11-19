"use client";

import confetti from "canvas-confetti";
import { Snowflake, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoopPointsSticker, Sticker } from "@/components/ui/stickers";
import { Switch } from "@/components/ui/switch";
import { trackGrowthUnlock } from "@/lib/analytics/ga4";
import { fetcher } from "@/lib/api";
import type { WeeklyRecap } from "@/lib/streaks/weekly-recap";

interface StreakExtrasResponse {
  recap: WeeklyRecap;
  freezes: number;
  maxFreezes: number;
  freezeCost: number;
  points: number;
  remindersEnabled: boolean;
  recentMilestone: { days: number; title: string; points: number } | null;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function shortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Confetti once per milestone per browser, so a reload doesn't replay it. */
function useMilestoneConfetti(days: number | undefined) {
  useEffect(() => {
    if (!days) return;
    const key = `campusloop_milestone_seen_${days}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.3 },
      // ds-allow: canvas-confetti takes hex only; celebratory burst, not UI chrome
      colors: ["#6b3df5", "#ffd43b", "#ff5c93", "#3ddc97"],
    });
  }, [days]);
}

/**
 * The parts of /streaks that are about the student's own week: a milestone
 * celebration, streak freezes bought with Loop Points, the weekly recap and
 * the reminder switch.
 */
export function StreakExtras() {
  const { data, isLoading, mutate } = useSWR<StreakExtrasResponse>("/api/streaks/recap", fetcher);
  const [buying, setBuying] = useState(false);
  const [savingReminders, setSavingReminders] = useState(false);
  useMilestoneConfetti(data?.recentMilestone?.days);

  if (isLoading && !data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
      </div>
    );
  }
  if (!data) return null;

  async function buyFreeze() {
    setBuying(true);
    try {
      const res = await fetch("/api/streaks/freeze", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't buy a freeze.");
        return;
      }
      trackGrowthUnlock("streak_freeze", "points");
      toast.success("Freeze added. It covers the next day you miss.");
      await mutate();
    } finally {
      setBuying(false);
    }
  }

  async function setReminders(enabled: boolean) {
    setSavingReminders(true);
    const previous = data;
    await mutate({ ...data!, remindersEnabled: enabled }, { revalidate: false });
    try {
      const res = await fetch("/api/growth/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error();
      toast.success(enabled ? "Reminders on" : "Reminders off. We won't send streak or campus reminders.");
    } catch {
      await mutate(previous, { revalidate: false });
      toast.error("Couldn't change reminders. Try again.");
    } finally {
      setSavingReminders(false);
    }
  }

  const { recap } = data;
  const full = data.freezes >= data.maxFreezes;
  const canAfford = data.points >= data.freezeCost;

  return (
    <div className="space-y-8">
      {data.recentMilestone && (
        <Sticker tone="reward" pop className="flex items-center gap-4 p-5">
          <Trophy className="size-10 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="sticker-caption text-2xl">
              {data.recentMilestone.days} days in a row: {data.recentMilestone.title}
            </p>
            <p className="text-sm font-semibold">+{data.recentMilestone.points} Loop Points added</p>
          </div>
        </Sticker>
      )}

      <section className="space-y-3 rounded-lg border border-border bg-surface p-4" aria-labelledby="freeze-title">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 id="freeze-title" className="flex items-center gap-2 text-lg text-fg">
              <Snowflake className="size-5 text-brand-text" aria-hidden="true" />
              Streak freeze
            </h2>
            <p className="text-sm text-fg-muted">
              Miss a day and a freeze keeps your streak going. It's used by itself the day after you miss.
            </p>
          </div>
          <p className="shrink-0 text-right text-sm text-fg-muted">
            <span className="block text-2xl font-bold tabular-nums text-fg">
              {data.freezes}/{data.maxFreezes}
            </span>
            held
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={buyFreeze} loading={buying} disabled={full || !canAfford}>
            {full ? "You hold the most" : `Get one for ${data.freezeCost} LP`}
          </Button>
          <LoopPointsSticker points={data.points} label="LP" size="sm" />
        </div>
        {!full && !canAfford && (
          <p className="text-sm text-fg-muted">
            You need {data.freezeCost - data.points} more LP. Posting, commenting and inviting friends all earn LP.
          </p>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="recap-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="recap-title" className="text-lg text-fg">
            Your week
          </h2>
          <span className="text-sm text-fg-muted">
            {shortDate(recap.from)} to {shortDate(recap.to)}
          </span>
        </div>
        <dl className="divide-y divide-border rounded-lg border border-border bg-surface text-sm">
          {[
            ["Days active", `${recap.activeDays} of 7`],
            ["Posts", plural(recap.posts, "post", "posts")],
            ["Comments", plural(recap.comments, "comment", "comments")],
            ["Upvotes on your posts", plural(recap.upvotesReceived, "upvote", "upvotes")],
            ["New followers", plural(recap.newFollowers, "follower", "followers")],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-fg-muted">{label}</dt>
              <dd className="font-semibold tabular-nums text-fg">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-fg">Streak and campus reminders</h2>
          <p className="text-sm text-fg-muted">
            At most 3 a day, never between 11 pm and 8 am. Turn off to stop them all.
          </p>
        </div>
        <Switch
          checked={data.remindersEnabled}
          onCheckedChange={(on) => void setReminders(on)}
          disabled={savingReminders}
          aria-label="Streak and campus reminders"
        />
      </section>
    </div>
  );
}
