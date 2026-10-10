"use client";

import { Check, ChevronRight, Flame } from "lucide-react";
import Link from "next/link";
import { useStreaks } from "@/hooks/use-streaks";
import { cn } from "@/lib/utils";

interface StreakBannerProps {
  className?: string;
}

export function StreakBanner({ className }: StreakBannerProps) {
  const { streak, isLoading } = useStreaks();

  if (isLoading || !streak) {
    return null;
  }

  const { currentStreak, longestStreak, isSafeToday, weeklyTracker } = streak;

  const supportingText = isSafeToday
    ? "Today’s streak is safe"
    : currentStreak === 0
      ? "Start your first streak"
      : "Your current run";

  return (
    <Link
      href="/streak"
      className={cn(
        "group block rounded-2xl border transition-all duration-200 select-none overflow-hidden cursor-pointer",
        isSafeToday
          ? "border-emerald-500/20 bg-emerald-500/[0.03] dark:bg-emerald-950/10 hover:border-emerald-500/30"
          : "border-border/50 bg-card/60 hover:border-amber-500/30 hover:bg-amber-500/[0.02]",
        className
      )}
      title="View streak details"
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* ─── LEFT: Primary Metric & Small Supporting Text ─── */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={cn(
              "flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
              isSafeToday
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-500"
            )}
          >
            <Flame
              className={cn(
                "size-5.5 sm:size-6 stroke-[2.2]",
                isSafeToday
                  ? "fill-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "fill-amber-500/20 text-amber-500"
              )}
            />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {currentStreak}
              </span>
              <span className="text-sm font-bold text-foreground">
                {currentStreak === 1 ? "day streak" : "days streak"}
              </span>
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              {supportingText}
            </p>
          </div>
        </div>

        {/* ─── RIGHT: Seven-Day Rhythm (M T W T F S S) & Best Run ─── */}
        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
          {/* 7-Day Rhythm */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl bg-background/70 border border-border/30"
            role="group"
            aria-label="Seven day activity rhythm"
          >
            {weeklyTracker.map((day) => (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1 px-1.5 py-0.5"
                title={`${day.date}: ${day.isCompleted ? "Completed" : day.isToday ? "Today" : "Inactive"}`}
                aria-label={`${day.dayLabel}: ${day.isCompleted ? "completed" : "inactive"}`}
              >
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {day.dayLabel}
                </span>
                <div
                  className={cn(
                    "size-4.5 rounded-full flex items-center justify-center transition-colors text-[9px]",
                    day.isCompleted
                      ? "bg-emerald-500 text-white font-bold"
                      : day.isToday
                        ? "border-2 border-amber-500/80 text-amber-500 font-bold bg-amber-500/10"
                        : "border border-border/60 bg-muted/30 text-transparent"
                  )}
                >
                  {day.isCompleted && <Check className="size-2.5 stroke-[3]" />}
                </div>
              </div>
            ))}
          </div>

          {/* Best Record & Detail Arrow */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-1">
            <span>Best: {longestStreak} days</span>
            <ChevronRight className="size-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
