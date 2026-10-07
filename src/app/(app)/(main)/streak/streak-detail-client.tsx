"use client";

import {
  ArrowLeft,
  Award,
  Check,
  ChevronRight,
  Crown,
  Flame,
  Lock,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { STREAK_MILESTONES, STREAK_QUALIFYING_EVENTS } from "@/constants/streaks";
import { useStreaks } from "@/hooks/use-streaks";
import { cn } from "@/lib/utils";

const MILESTONE_ICONS: Record<string, typeof Flame> = {
  Seedling: Sparkles,
  Flame: Flame,
  Zap: Zap,
  Star: Star,
  Award: Award,
  Crown: Crown,
  Trophy: Trophy,
  Sparkles: Sparkles,
};

export function StreakDetailClient() {
  const router = useRouter();
  const { streak, isLoading, qualifyActivity } = useStreaks();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || !streak) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-muted/60 rounded" />
        <div className="h-28 bg-muted/40 rounded-2xl" />
        <div className="h-44 bg-muted/30 rounded-2xl" />
      </div>
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

  const handleQuickQualify = async () => {
    if (isSafeToday || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await qualifyActivity(todayMission.qualifyingEvent);
    } finally {
      setIsSubmitting(false);
    }
  };

  // State-based motivating subtitle
  let stateSubtitle = "Keep your campus loop going.";
  if (currentStreak === 0) {
    stateSubtitle = "Start your first streak with one authentic action today.";
  } else if (isSafeToday) {
    stateSubtitle = "Today’s streak is safe. No further action needed.";
  } else if (longestStreak > currentStreak && currentStreak === 1) {
    stateSubtitle = `New run started. Your previous best was ${longestStreak} days.`;
  } else if (!isSafeToday) {
    stateSubtitle = "One meaningful action keeps your loop going today.";
  }

  // Monthly activity calendar calculation (Last 28 days grid: 4 weeks x 7 columns)
  const today = new Date();
  const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const calendarDays = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (27 - i));
    const dateStr = d.toISOString().split("T")[0];
    const isCompleted = historyDates.includes(dateStr);
    const isCurrent = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    const dayOfMonth = d.getDate();
    return {
      dateStr,
      dayOfMonth,
      isCompleted,
      isCurrent,
      isFuture,
    };
  });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-8 select-none">
      {/* ─── Navigation Header ─── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </button>

        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Campus Loop System
        </span>
      </div>

      {/* ─── 1. HEADER: Primary Streak Metric & Motivating State ─── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-baseline gap-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            {currentStreak} {currentStreak === 1 ? "day" : "days"}
          </h1>
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-xl",
              isSafeToday
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-500"
            )}
          >
            <Flame
              className={cn(
                "size-5 stroke-[2.2]",
                isSafeToday
                  ? "fill-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "fill-amber-500/20 text-amber-500"
              )}
            />
          </div>
        </div>

        <p className="text-sm sm:text-base font-medium text-muted-foreground">
          {stateSubtitle}
        </p>

        <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground font-semibold">
          <span>Personal Best: <strong>{longestStreak} days</strong></span>
          <span>·</span>
          <span>
            Status:{" "}
            <strong className={isSafeToday ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
              {isSafeToday ? "Safe Today" : "Action Needed"}
            </strong>
          </span>
        </div>
      </div>

      <hr className="border-border/30" />

      {/* ─── 2. WEEK RHYTHM (7-Day Activity Rhythm) ─── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Seven-Day Rhythm
        </h2>

        <div
          className="flex items-center justify-between gap-1 p-2 sm:p-3 rounded-2xl bg-card/60 border border-border/40"
          role="group"
          aria-label="Seven day activity rhythm"
        >
          {weeklyTracker.map((day) => (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1.5 py-1"
              aria-label={`${day.dayLabel}: ${day.isCompleted ? "completed" : "inactive"}`}
            >
              <span className="text-xs font-bold text-muted-foreground uppercase">
                {day.dayLabel}
              </span>
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center transition-colors text-xs font-bold",
                  day.isCompleted
                    ? "bg-emerald-500 text-white"
                    : day.isToday
                      ? "border-2 border-amber-500 text-amber-500 bg-amber-500/10"
                      : "border border-border/60 bg-muted/30 text-transparent"
                )}
              >
                {day.isCompleted && <Check className="size-4 stroke-[3]" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 3. CURRENT PROGRESS (Next Milestone Step) ─── */}
      {nextMilestone && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between text-xs">
            <h2 className="font-bold uppercase tracking-wider text-muted-foreground">
              Next Milestone
            </h2>
            <span className="font-bold text-foreground">
              {currentStreak} / {nextMilestone.days} days
            </span>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{nextMilestone.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {Math.max(0, nextMilestone.days - currentStreak)} {nextMilestone.days - currentStreak === 1 ? "day" : "days"} to your next milestone
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-xs font-bold">
                +{nextMilestone.points} LP Bonus
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(6, Math.round((currentStreak / nextMilestone.days) * 100)))}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. HISTORY (Calm 28-Day Contribution Calendar) ─── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Recent Activity (Last 28 Days)
        </h2>

        <div className="rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
            {calendarDays.map((d) => (
              <div
                key={d.dateStr}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-colors",
                  d.isCompleted
                    ? "bg-emerald-500 text-white font-bold"
                    : d.isCurrent
                      ? "border-2 border-amber-500 text-amber-500 bg-amber-500/10 font-bold"
                      : "border border-border/40 text-muted-foreground bg-muted/20"
                )}
                title={`${d.dateStr}: ${d.isCompleted ? "Active" : d.isCurrent ? "Today" : "Inactive"}`}
                aria-label={`${d.dateStr}: ${d.isCompleted ? "Active" : "Inactive"}`}
              >
                <span>{d.dayOfMonth}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-4 text-[11px] text-muted-foreground font-semibold pt-1">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded bg-muted/50 border border-border/60" />
              Inactive
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded bg-emerald-500" />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded border border-amber-500 bg-amber-500/20" />
              Today
            </span>
          </div>
        </div>
      </div>

      {/* ─── 5. MILESTONE PROGRESSION TIMELINE ─── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Milestones Ladder
        </h2>

        <div className="space-y-2">
          {STREAK_MILESTONES.map((m) => {
            const isUnlocked = longestStreak >= m.days;
            const Icon = MILESTONE_ICONS[m.iconName] || Sparkles;

            return (
              <div
                key={m.days}
                className={cn(
                  "flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border transition-colors",
                  isUnlocked
                    ? "border-primary/25 bg-primary/[0.04] text-foreground"
                    : "border-border/30 bg-muted/15 text-muted-foreground opacity-75"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      isUnlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isUnlocked ? <Icon className="size-4.5" /> : <Lock className="size-4" />}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {m.title} ({m.days} Days)
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-medium">
                      {m.description}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "text-xs font-bold shrink-0 px-2 py-1 rounded-lg",
                    isUnlocked
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted/40 text-muted-foreground"
                  )}
                >
                  +{m.points} LP
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 6. RULES: Qualifying Activities ─── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          How Streaks Work
        </h2>

        <div className="rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Streaks measure authentic student engagement on CampusLoop. Complete any single qualifying campus action before midnight (IST) to keep your streak alive. Consecutive days unlock Loop Point milestone bonuses and leaderboard standing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {Object.values(STREAK_QUALIFYING_EVENTS).map((ev) => (
              <div
                key={ev.key}
                className="p-2.5 rounded-xl border border-border/30 bg-background/50 flex items-start gap-2.5 text-xs"
              >
                <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="min-w-0 space-y-0.5">
                  <strong className="text-foreground font-semibold block">{ev.label}</strong>
                  <span className="text-muted-foreground text-[11px] block">{ev.description}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Today Action CTA */}
          <div className="pt-2 border-t border-border/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-foreground block">
                Today’s Mission: {todayMission.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {todayMission.instruction}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={todayMission.ctaHref}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/95 transition-all active:scale-98 cursor-pointer"
              >
                <span>{todayMission.ctaLabel}</span>
                <ChevronRight className="size-3.5" />
              </Link>

              {!isSafeToday && (
                <button
                  type="button"
                  onClick={handleQuickQualify}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-xl border border-border/50 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "I did this"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
