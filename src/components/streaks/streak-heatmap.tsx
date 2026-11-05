"use client";

import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flame,
  HelpCircle,
  Info,
  Lock,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { STREAK_MILESTONES, STREAK_QUALIFYING_EVENTS } from "@/constants/streaks";
import { useStreaks } from "@/hooks/use-streaks";
import { cn } from "@/lib/utils";

interface StreakHeatmapProps {
  profileId?: string;
}

type TimeframeView = "year" | "6months" | "3months";

interface HeatmapDay {
  dateStr: string;
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  weekIndex: number;
  month: string;
  isToday: boolean;
  isFuture: boolean;
  isCompleted: boolean;
  count: number;
}

export function StreakHeatmap({ profileId }: StreakHeatmapProps) {
  const router = useRouter();
  const { streak, isLoading, isError, mutate, qualifyActivity } = useStreaks(profileId);
  const [timeframe, setTimeframe] = useState<TimeframeView>("year");
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timezone-safe today date string (Asia/Kolkata)
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }, []);

  const totalWeeks = timeframe === "year" ? 52 : timeframe === "6months" ? 26 : 13;
  const totalDays = totalWeeks * 7;

  const currentStreak = Math.max(1, streak?.currentStreak ?? 1);
  const longestStreak = Math.max(1, streak?.longestStreak ?? 1);
  const totalQualifiedDays = Math.max(1, streak?.totalQualifiedDays ?? 1);
  const isSafeToday = Boolean(streak?.isSafeToday);

  // Build the calendar matrix
  const { weeks, monthLabels } = useMemo(() => {
    const historySet = new Set(streak?.historyDates ?? []);
    if (isSafeToday) {
      historySet.add(todayStr);
    }

    const todayDate = new Date(todayStr + "T00:00:00.000Z");
    const todayDayOfWeek = todayDate.getUTCDay(); // 0 = Sun, 6 = Sat

    // Calculate start date so that today lands on the last column at today's day of week
    const startDate = new Date(todayDate);
    startDate.setUTCDate(todayDate.getUTCDate() - (totalDays - 1 - (6 - todayDayOfWeek)));

    const days: HeatmapDay[] = [];
    const monthsMap = new Map<number, string>();

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setUTCDate(startDate.getUTCDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getUTCDay();
      const weekIndex = Math.floor(i / 7);

      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      const isCompleted = historySet.has(dateStr);

      // Track month labels at the first week of a month
      const monthShort = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
      if (d.getUTCDate() <= 7 && !monthsMap.has(weekIndex)) {
        monthsMap.set(weekIndex, monthShort);
      }

      days.push({
        dateStr,
        dayOfWeek,
        weekIndex,
        month: monthShort,
        isToday,
        isFuture,
        isCompleted,
        count: isCompleted ? 1 : 0,
      });
    }

    // Group into columns of 7 days (weeks)
    const groupedWeeks: HeatmapDay[][] = [];
    for (let w = 0; w < totalWeeks; w++) {
      groupedWeeks.push(days.slice(w * 7, (w + 1) * 7));
    }

    const labels: { weekIndex: number; label: string }[] = [];
    monthsMap.forEach((label, weekIndex) => {
      labels.push({ weekIndex, label });
    });

    return { weeks: groupedWeeks, monthLabels: labels };
  }, [streak?.historyDates, isSafeToday, todayStr, totalDays, totalWeeks]);

  const handleQuickQualify = async () => {
    if (isSafeToday || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await qualifyActivity("DAILY_MISSION_COMPLETE");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-muted/60 rounded-lg" />
        <div className="h-32 bg-muted/40 rounded-3xl" />
        <div className="h-64 bg-muted/30 rounded-3xl" />
      </main>
    );
  }

  if (isError || !streak) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-reward/10 text-reward-text">
          <Flame className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-black text-foreground">Streaks &amp; Heatmap</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t load your daily rhythm data. Your streak progress is securely saved.
        </p>
        <button
          type="button"
          onClick={() => void mutate()}
          className="mt-6 rounded-2xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 cursor-pointer"
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-8 select-none">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 px-3 py-1 text-xs font-bold text-foreground shadow-2xs">
            <Flame className="size-3.5 fill-reward text-reward-text" />
            <span>Campus Streak Rhythm</span>
          </span>
        </div>
      </div>

      {/* ─── Hero Overview Card ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-6 sm:p-8 shadow-2xs backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-reward/15 text-reward-text">
                <Flame className="size-6.5 fill-reward/25 stroke-[2.2]" />
              </span>
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                    {currentStreak}
                  </h1>
                  <span className="text-lg font-bold text-muted-foreground">
                    {currentStreak === 1 ? "day streak" : "days streak"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {isSafeToday
                    ? "Your streak is safe today. High five!"
                    : "Action needed today to extend your flame tomorrow."}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            {isSafeToday ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-2.5 text-xs font-bold text-success">
                <CheckCircle2 className="size-4 text-success" />
                <span>Safe for Today</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleQuickQualify}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-transform hover:bg-primary/95 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <Zap className="size-4" />
                <span>{isSubmitting ? "Updating..." : "Complete Today's Loop"}</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Metric Pillars ─── */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-border/30">
          <div className="rounded-2xl border border-border/30 bg-background/50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Flame className="size-3.5 text-reward-text" />
              <span>Current</span>
            </div>
            <p className="mt-1 text-2xl font-black text-foreground">{currentStreak}d</p>
            <p className="text-[11px] font-medium text-muted-foreground/80">Active sequence</p>
          </div>

          <div className="rounded-2xl border border-border/30 bg-background/50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Trophy className="size-3.5 text-reward-text" />
              <span>Personal Best</span>
            </div>
            <p className="mt-1 text-2xl font-black text-foreground">{longestStreak}d</p>
            <p className="text-[11px] font-medium text-muted-foreground/80">All-time record</p>
          </div>

          <div className="rounded-2xl border border-border/30 bg-background/50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Calendar className="size-3.5 text-primary" />
              <span>Total Active</span>
            </div>
            <p className="mt-1 text-2xl font-black text-foreground">{totalQualifiedDays}d</p>
            <p className="text-[11px] font-medium text-muted-foreground/80">Logged campus days</p>
          </div>

          <div className="rounded-2xl border border-border/30 bg-background/50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Sparkles className="size-3.5 text-success" />
              <span>Loop Status</span>
            </div>
            <p className="mt-1 text-base sm:text-lg font-black text-foreground truncate">
              {isSafeToday ? "Safe & Synced" : "Pending Action"}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground/80">
              {isSafeToday ? "No freeze required" : "1 post or vote"}
            </p>
          </div>
        </div>
      </section>

      {/* ─── GitHub-Style Activity Heatmap ─── */}
      <section className="rounded-3xl border border-border/40 bg-card/60 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-foreground">Activity Heatmap</h2>
            <p className="text-xs text-muted-foreground font-medium">
              Daily authentic contributions, posts, study notes, and interactions
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="inline-flex rounded-xl border border-border/40 bg-background/60 p-1 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeframe("3months")}
              className={cn(
                "rounded-lg px-3 py-1.5 transition-colors cursor-pointer",
                timeframe === "3months"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              3 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("6months")}
              className={cn(
                "rounded-lg px-3 py-1.5 transition-colors cursor-pointer",
                timeframe === "6months"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("year")}
              className={cn(
                "rounded-lg px-3 py-1.5 transition-colors cursor-pointer",
                timeframe === "year"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              12 Months
            </button>
          </div>
        </div>

        {/* Heatmap Grid Container */}
        <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin">
          <div className="min-w-fit space-y-2">
            {/* Month Labels Header */}
            <div className="flex text-[11px] font-semibold text-muted-foreground h-5 pl-7">
              {monthLabels.map(({ weekIndex, label }) => (
                <div
                  key={`${weekIndex}-${label}`}
                  style={{
                    position: "relative",
                    left: `${weekIndex * 15}px`,
                    marginRight: "-15px",
                  }}
                  className="whitespace-nowrap"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Matrix: Days of Week + 52 Week Columns */}
            <div className="flex gap-2">
              {/* Day of Week Labels */}
              <div className="flex flex-col justify-between text-[10px] font-semibold text-muted-foreground/80 py-0.5 select-none w-5">
                <span>Sun</span>
                <span>Tue</span>
                <span>Thu</span>
                <span>Sat</span>
              </div>

              {/* Grid of Columns */}
              <div className="flex gap-1">
                {weeks.map((week, wIdx) => (
                  <div key={`w-${wIdx}`} className="flex flex-col gap-1">
                    {week.map((day) => {
                      const isHovered = hoveredDay?.dateStr === day.dateStr;
                      return (
                        <div
                          key={day.dateStr}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={cn(
                            "size-3 sm:size-3.5 rounded-xs transition-colors cursor-pointer relative",
                            day.isFuture
                              ? "bg-muted/15 border border-dashed border-border/20 cursor-default"
                              : day.isCompleted
                                ? day.isToday
                                  ? "bg-success shadow-xs ring-1 ring-success"
                                  : "bg-success/75 hover:scale-125 hover:z-10"
                                : "bg-muted/40 hover:bg-muted/70",
                            day.isToday && !day.isCompleted && "ring-1 ring-reward/80",
                            isHovered && "ring-2 ring-primary z-20 scale-125"
                          )}
                          title={`${day.dateStr}: ${
                            day.isCompleted ? "Active Loop Logged" : "No activity"
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Tooltip / Status Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/30 text-xs">
          <div className="min-h-5 text-muted-foreground font-medium">
            {hoveredDay ? (
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Calendar className="size-3.5 text-primary" />
                <span>{hoveredDay.dateStr}</span>
                <span className="text-muted-foreground font-normal">·</span>
                <span
                  className={
                    hoveredDay.isCompleted
                      ? "text-success font-bold"
                      : "text-muted-foreground"
                  }
                >
                  {hoveredDay.isCompleted
                    ? "Campus Loop Completed (+5 LP)"
                    : hoveredDay.isToday
                      ? "Action needed today"
                      : hoveredDay.isFuture
                        ? "Future date"
                        : "No activity logged"}
                </span>
              </span>
            ) : (
              <span>Hover over any calendar cell to view daily activity</span>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="size-2.5 rounded-xs bg-muted/40" />
              <span className="size-2.5 rounded-xs bg-success/40" />
              <span className="size-2.5 rounded-xs bg-success/75" />
              <span className="size-2.5 rounded-xs bg-success" />
            </div>
            <span>More</span>
          </div>
        </div>
      </section>

      {/* ─── Qualifying Actions Guide ─── */}
      <section className="rounded-3xl border border-border/40 bg-card/60 p-6 sm:p-8 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-black text-foreground">How To Keep Your Streak Alive</h2>
          <p className="text-xs text-muted-foreground font-medium">
            Any one of these authentic campus actions qualifies your daily loop and earns Loop Points
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {Object.entries(STREAK_QUALIFYING_EVENTS).slice(0, 6).map(([key, ev]) => (
            <div
              key={key}
              className="rounded-2xl border border-border/30 bg-background/50 p-4 space-y-1.5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{ev.label}</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  +{ev.pointsBonus} LP
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {ev.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Milestones Progression ─── */}
      <section className="rounded-3xl border border-border/40 bg-card/60 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-foreground">Streak Milestones</h2>
            <p className="text-xs text-muted-foreground font-medium">
              Unlock exclusive badges and massive Loop Point bonuses as your streak grows
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {STREAK_MILESTONES.map((milestone) => {
            const isUnlocked = longestStreak >= milestone.days;
            return (
              <div
                key={milestone.days}
                className={cn(
                  "rounded-2xl border p-4 space-y-2 transition-colors",
                  isUnlocked
                    ? "border-success/30 bg-success/[0.04] text-foreground"
                    : "border-border/30 bg-background/40 opacity-70"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl font-bold",
                      isUnlocked
                        ? "bg-success/20 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isUnlocked ? (
                      <CheckCircle2 className="size-4.5" />
                    ) : (
                      <Lock className="size-4" />
                    )}
                  </span>
                  <span className="text-xs font-black">+{milestone.points} LP</span>
                </div>

                <div>
                  <p className="text-sm font-black text-foreground">{milestone.title}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {milestone.days} Days Streak
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
