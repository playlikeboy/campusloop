"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

export interface StoryProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  count: number;
  /** Index of the segment playing now (0-based). Earlier segments are full. */
  current: number;
  /** Auto-play: ms for the current segment; calls onComplete when it fills. */
  duration?: number;
  onComplete?: () => void;
  /** Manual mode: 0–1 fill of the current segment (ignored when duration is set). */
  progress?: number;
  paused?: boolean;
  /** `onField` = white bars for violet story fields and photos. */
  tone?: "default" | "onField";
}

/** Segmented story progress bars. Timing is content, not decoration, so it keeps running under reduced motion. */
export function StoryProgress({
  count,
  current,
  duration,
  onComplete,
  progress = 0,
  paused,
  tone = "default",
  className,
  ...props
}: StoryProgressProps) {
  const track = tone === "onField" ? "bg-story-field-fg/35" : "bg-border";
  const fill = tone === "onField" ? "bg-story-field-fg" : "bg-brand";

  return (
    <div
      data-slot="story-progress"
      role="progressbar"
      aria-label={`Story ${Math.min(current + 1, count)} of ${count}`}
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={Math.min(current + 1, count)}
      className={cn("flex w-full gap-1", className)}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span key={i} className={cn("h-1 flex-1 overflow-hidden rounded-full", track)}>
            {active && duration ? (
              <span
                key={`run-${current}`}
                className={cn("keep-motion story-seg block h-full origin-left rounded-full", fill)}
                style={{
                  animationDuration: `${duration}ms`,
                  animationPlayState: paused ? "paused" : "running",
                }}
                onAnimationEnd={onComplete}
              />
            ) : (
              <span
                className={cn("block h-full origin-left rounded-full", fill)}
                style={{ transform: `scaleX(${done ? 1 : active ? Math.min(1, Math.max(0, progress)) : 0})` }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
