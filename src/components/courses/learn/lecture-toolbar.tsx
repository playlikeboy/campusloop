"use client";

import { ChevronLeft, ChevronRight, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

interface Props {
  hasPrev: boolean;
  hasNext: boolean;
  done: boolean;
  rate: number | null;
  onPrev: () => void;
  onNext: () => void;
  onDone: (done: boolean) => void;
  onRate: (rate: number) => void;
}

/** Row under the video: previous, mark as done, speed, next. */
export function LectureToolbar({ hasPrev, hasNext, done, rate, onPrev, onNext, onDone, onRate }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface px-2 py-1.5 sm:px-4">
      <Button variant="ghost" size="sm" className="h-11" onClick={onPrev} disabled={!hasPrev}>
        <ChevronLeft aria-hidden /> Previous
      </Button>
      <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium text-fg transition-ui hover:bg-surface-muted">
        <Checkbox checked={done} onCheckedChange={(v) => onDone(Boolean(v))} />
        Done
      </label>
      {rate !== null && (
        <label className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm text-fg-muted transition-ui hover:bg-surface-muted">
          <Gauge className="size-4" aria-hidden />
          <span className="sr-only">Playback speed</span>
          <select
            value={rate}
            onChange={(e) => onRate(Number(e.target.value))}
            className="cursor-pointer bg-transparent text-sm font-medium tabular-nums text-fg focus-visible:outline-none"
          >
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r}x
              </option>
            ))}
          </select>
        </label>
      )}
      <Button
        variant="secondary"
        size="sm"
        className="ml-auto h-11 px-4"
        onClick={onNext}
        disabled={!hasNext}
      >
        Next <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}
