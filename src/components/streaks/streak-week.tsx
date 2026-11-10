import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StreakWeekDay {
  date: string;
  dayLabel: string;
  isToday: boolean;
  isCompleted: boolean;
}

/** Seven steps, oldest to today. Done days are mint, today is outlined. */
export function StreakWeek({ days, className }: { days: StreakWeekDay[]; className?: string }) {
  return (
    <ol className={cn("grid grid-cols-7 gap-1.5", className)} aria-label="Last 7 days">
      {days.map((day) => {
        const state = day.isCompleted ? "done" : day.isToday ? "today, not done yet" : "missed";
        return (
          <li key={day.date} className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-fg-subtle" aria-hidden="true">
              {day.dayLabel}
            </span>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-xs font-semibold",
                day.isCompleted
                  ? "bg-brand text-brand-fg"
                  : day.isToday
                    ? "border-2 border-border-strong bg-surface text-fg"
                    : "border border-border bg-surface-muted"
              )}
            >
              {day.isCompleted && <Check aria-hidden="true" className="size-4" />}
              <span className="sr-only">
                {day.date}: {state}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
