"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

type Timeframe = "3m" | "6m" | "12m";

const WEEKS: Record<Timeframe, number> = { "3m": 13, "6m": 26, "12m": 52 };

interface HeatmapDay {
  dateStr: string;
  isToday: boolean;
  isFuture: boolean;
  isCompleted: boolean;
}

/** Today's date in IST as YYYY-MM-DD. */
export function todayIst() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Calendar of active days. Columns are weeks, rows are Sunday to Saturday. */
export function StreakHeatmap({
  historyDates,
  isSafeToday,
}: {
  historyDates: string[];
  isSafeToday: boolean;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const todayStr = useMemo(() => todayIst(), []);
  const totalWeeks = WEEKS[timeframe];

  const { weeks, months, activeCount } = useMemo(() => {
    const history = new Set(historyDates);
    if (isSafeToday) history.add(todayStr);

    const today = new Date(`${todayStr}T00:00:00.000Z`);
    const totalDays = totalWeeks * 7;
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - (totalDays - 1 - (6 - today.getUTCDay())));

    const cols: HeatmapDay[][] = [];
    const labels: { week: number; label: string }[] = [];
    let count = 0;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const week = Math.floor(i / 7);
      if (!cols[week]) cols[week] = [];
      const isFuture = dateStr > todayStr;
      const isCompleted = !isFuture && history.has(dateStr);
      if (isCompleted) count++;
      cols[week].push({ dateStr, isToday: dateStr === todayStr, isFuture, isCompleted });
      if (d.getUTCDate() <= 7 && d.getUTCDay() === 0) {
        labels.push({ week, label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) });
      }
    }
    return { weeks: cols, months: labels, activeCount: count };
  }, [historyDates, isSafeToday, todayStr, totalWeeks]);

  return (
    <section className="space-y-4" aria-labelledby="heatmap-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="heatmap-title" className="text-lg text-fg">
            Active days
          </h2>
          <p className="text-sm text-fg-muted">
            {activeCount} {activeCount === 1 ? "day" : "days"} in this period
          </p>
        </div>
        <SegmentedControl
          aria-label="Time period"
          size="sm"
          value={timeframe}
          onChange={setTimeframe}
          options={[
            { value: "3m", label: "3 months" },
            { value: "6m", label: "6 months" },
            { value: "12m", label: "1 year" },
          ]}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface p-4">
        <div className="min-w-fit space-y-1.5">
          <div className="relative h-4 pl-8 text-xs text-fg-subtle" aria-hidden="true">
            {months.map(({ week, label }) => (
              <span
                key={`${week}-${label}`}
                className="absolute"
                style={{ left: `calc(2rem + ${week} * 1.125rem)` }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div
              className="flex w-6 flex-col justify-between py-0.5 text-xs text-fg-subtle"
              aria-hidden="true"
            >
              <span>Sun</span>
              <span>Wed</span>
              <span>Sat</span>
            </div>
            <div
              className="flex gap-1"
              role="img"
              aria-label={`${activeCount} active days in the selected period`}
            >
              {weeks.map((week) => (
                <div key={week[0].dateStr} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <span
                      key={day.dateStr}
                      title={`${formatDay(day.dateStr)}: ${day.isCompleted ? "active" : day.isFuture ? "upcoming" : "not active"}`}
                      className={cn(
                        "size-3.5 rounded-xs",
                        day.isFuture
                          ? "bg-transparent"
                          : day.isCompleted
                            ? "bg-brand"
                            : "bg-surface-sunken",
                        day.isToday && "ring-2 ring-border-strong ring-offset-1 ring-offset-surface"
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 text-xs text-fg-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-xs bg-surface-sunken" aria-hidden="true" />
          Not active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-xs bg-brand" aria-hidden="true" />
          Active
        </span>
      </div>
    </section>
  );
}
