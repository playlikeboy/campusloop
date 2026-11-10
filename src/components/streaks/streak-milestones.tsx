import { Check, Lock } from "lucide-react";
import { STREAK_MILESTONES } from "@/constants/streaks";
import { cn } from "@/lib/utils";

/** Milestone ladder. A milestone counts once your best streak reaches it. */
export function StreakMilestones({ longestStreak, limit }: { longestStreak: number; limit?: number }) {
  const milestones = limit ? STREAK_MILESTONES.slice(0, limit) : STREAK_MILESTONES;

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {milestones.map((m) => {
        const done = longestStreak >= m.days;
        return (
          <li key={m.days} className="flex items-center gap-3 px-4 py-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                done ? "bg-brand text-brand-fg" : "bg-surface-muted text-fg-subtle"
              )}
            >
              {done ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                <Lock aria-hidden="true" className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{m.title}</p>
              <p className="text-sm text-fg-muted">
                {m.days}-day streak{done ? " · reached" : ""}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-reward-text">
              +{m.points} LP
            </span>
          </li>
        );
      })}
    </ul>
  );
}
