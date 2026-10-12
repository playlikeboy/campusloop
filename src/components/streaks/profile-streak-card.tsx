"use client";

import {
  Award,
  CheckCircle2,
  Crown,
  Flame,
  Lock,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { STREAK_MILESTONES } from "@/constants/streaks";
import { useStreaks } from "@/hooks/use-streaks";
import { cn } from "@/lib/utils";

interface ProfileStreakCardProps {
  className?: string;
  profileId?: string;
}

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

export function ProfileStreakCard({ className, profileId }: ProfileStreakCardProps) {
  const { streak, isLoading } = useStreaks(profileId);

  if (isLoading || !streak) {
    return (
      <div className={cn("rounded-2xl border border-border/40 bg-card/60 p-5 space-y-4 animate-pulse", className)}>
        <div className="h-5 w-32 rounded bg-muted/60" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 rounded-xl bg-muted/40" />
          <div className="h-16 rounded-xl bg-muted/40" />
          <div className="h-16 rounded-xl bg-muted/40" />
        </div>
      </div>
    );
  }

  const { currentStreak, longestStreak, totalQualifiedDays, isSafeToday } = streak;

  return (
    <div className={cn("rounded-2xl border border-border/40 bg-card/60 p-5 space-y-5", className)}>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
            <Flame className="size-4.5 fill-amber-500/20 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Campus Streak &amp; Milestones</h3>
            <p className="text-xs text-muted-foreground font-medium">Daily authentic campus engagement</p>
          </div>
        </div>

        {isSafeToday && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span>Safe Today</span>
          </span>
        )}
      </div>

      {/* ─── 3 Symmetrical Stat Counters ─── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/30 bg-background/60 p-3 text-center space-y-0.5">
          <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {currentStreak}
          </div>
          <div className="text-xs text-muted-foreground font-semibold">Active Streak</div>
        </div>

        <div className="rounded-xl border border-border/30 bg-background/60 p-3 text-center space-y-0.5">
          <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {longestStreak}
          </div>
          <div className="text-xs text-muted-foreground font-semibold">Longest Run</div>
        </div>

        <div className="rounded-xl border border-border/30 bg-background/60 p-3 text-center space-y-0.5">
          <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {totalQualifiedDays}
          </div>
          <div className="text-xs text-muted-foreground font-semibold">Total Days</div>
        </div>
      </div>

      {/* ─── Milestones Ladder ─── */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Milestone Progression
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {STREAK_MILESTONES.slice(0, 8).map((m) => {
            const isUnlocked = longestStreak >= m.days;
            const Icon = MILESTONE_ICONS[m.iconName] || Sparkles;

            return (
              <div
                key={m.days}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all select-none",
                  isUnlocked
                    ? "border-primary/25 bg-primary/[0.04] text-foreground"
                    : "border-border/30 bg-muted/20 opacity-60 text-muted-foreground"
                )}
                title={m.description}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    isUnlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {isUnlocked ? <Icon className="size-4" /> : <Lock className="size-3.5" />}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="truncate text-xs font-bold text-foreground">{m.title}</div>
                  <div className="text-[11px] font-semibold text-muted-foreground">
                    {m.days} Days · +{m.points} LP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
