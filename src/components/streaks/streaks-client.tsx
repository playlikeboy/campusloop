"use client";

import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { STREAK_QUALIFYING_EVENTS } from "@/constants/streaks";
import { useStreaks } from "@/hooks/use-streaks";
import { StreakHeatmap } from "./streak-heatmap";
import { StreakMilestones } from "./streak-milestones";
import { StreakWeek } from "./streak-week";

/** /streaks: your run, the last 7 days, today's task, active days and milestones. */
export function StreaksClient({ profileId }: { profileId?: string }) {
  const isOwn = !profileId;
  const { streak, isLoading, isError, mutate, qualifyActivity } = useStreaks(profileId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6" aria-busy="true">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (isError || !streak) {
    return (
      <EmptyState
        icon={Flame}
        title="Couldn't load the streak"
        description="Your progress is saved. Check your connection and try again."
        action={<Button onClick={() => void mutate()}>Try again</Button>}
      />
    );
  }

  const {
    currentStreak,
    longestStreak,
    isSafeToday,
    weeklyTracker,
    historyDates,
    nextMilestone,
    todayMission,
  } = streak;
  const progress = nextMilestone
    ? Math.min(100, Math.round((currentStreak / nextMilestone.days) * 100))
    : 100;

  async function markDone() {
    if (isSafeToday || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await qualifyActivity(todayMission.qualifyingEvent);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-6 pb-28 sm:px-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl text-fg sm:text-5xl">
            <span className="tabular-nums">{currentStreak}</span> {currentStreak === 1 ? "day" : "days"}
          </h1>
          {isSafeToday ? <Badge variant="verified">Streak safe today</Badge> : null}
        </div>
        <p className="text-base text-fg-muted">
          {isOwn
            ? isSafeToday
              ? "You're done for today. See you tomorrow."
              : "Do one thing on CampusLoop today to keep it going."
            : "Days in a row with at least one post, vote, comment or upload."}{" "}
          Best so far: {longestStreak} {longestStreak === 1 ? "day" : "days"}.
        </p>
        <StreakWeek days={weeklyTracker} />
      </header>

      {isOwn && !isSafeToday && (
        <section
          className="space-y-3 rounded-lg border border-border bg-surface p-4"
          aria-labelledby="today-title"
        >
          <h2 id="today-title" className="text-lg text-fg">
            Today
          </h2>
          <p className="text-sm text-fg">{todayMission.instruction}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={todayMission.ctaHref}>
                {todayMission.ctaLabel}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" onClick={markDone} loading={isSubmitting}>
              Mark as done
            </Button>
          </div>
        </section>
      )}

      {nextMilestone && (
        <section className="space-y-2" aria-labelledby="next-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="next-title" className="text-lg text-fg">
              Next: {nextMilestone.title}
            </h2>
            <span className="text-sm tabular-nums text-fg-muted">
              {currentStreak} / {nextMilestone.days} days
            </span>
          </div>
          <div
            className="relative h-3 overflow-hidden rounded-sm bg-poll-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={nextMilestone.days}
            aria-valuenow={currentStreak}
            aria-label={`Progress to ${nextMilestone.title}`}
          >
            <div
              className="poll-fill absolute inset-0 bg-poll-fill"
              style={{ "--fill": progress } as React.CSSProperties}
            />
          </div>
          <p className="text-sm text-fg-muted">
            Reach {nextMilestone.days} days to get{" "}
            <span className="font-semibold text-reward-text">+{nextMilestone.points} LP</span>.
          </p>
        </section>
      )}

      <StreakHeatmap historyDates={historyDates} isSafeToday={isSafeToday} />

      <section className="space-y-3" aria-labelledby="milestones-title">
        <h2 id="milestones-title" className="text-lg text-fg">
          Milestones
        </h2>
        <StreakMilestones longestStreak={longestStreak} />
      </section>

      <section className="space-y-3" aria-labelledby="how-title">
        <h2 id="how-title" className="text-lg text-fg">
          What counts
        </h2>
        <p className="text-sm text-fg-muted">
          Do any one of these before midnight (IST). You get points for the first one each day.
        </p>
        <ul className="grid gap-x-6 gap-y-2 text-sm text-fg sm:grid-cols-2">
          {Object.values(STREAK_QUALIFYING_EVENTS).map((ev) => (
            <li
              key={ev.key}
              className="flex items-baseline justify-between gap-3 border-b border-border py-2"
            >
              <span>{ev.label}</span>
              <span className="shrink-0 tabular-nums text-reward-text">+{ev.pointsBonus} LP</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
