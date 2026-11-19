"use client";

import { ChevronLeft, ChevronRight, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

interface Props {
  title: string;
  position: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  done: boolean;
  rate: number | null;
  onPrev: () => void;
  onNext: () => void;
  onDone: (done: boolean) => void;
  onRate: (rate: number) => void;
}

/**
 * Row under the video. Phones get the lecture title and done/speed here, and
 * previous/next live in the thumb bar at the bottom (LectureNavBar).
 * Desktop keeps previous, done, speed and next on one row.
 */
export function LectureToolbar({
  title,
  position,
  total,
  hasPrev,
  hasNext,
  done,
  rate,
  onPrev,
  onNext,
  onDone,
  onRate,
}: Props) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="px-4 pt-3 lg:hidden">
        <p className="text-xs font-semibold tabular-nums text-fg-muted">
          Lecture {position} of {total}
        </p>
        <h2 className="mt-0.5 line-clamp-2 font-sans text-base font-semibold leading-snug text-fg">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 sm:px-4 lg:py-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-11 max-lg:hidden"
          onClick={onPrev}
          disabled={!hasPrev}
        >
          <ChevronLeft aria-hidden /> Previous
        </Button>
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium text-fg transition-ui hover:bg-surface-muted">
          <Checkbox checked={done} onCheckedChange={(v) => onDone(Boolean(v))} />
          {done ? "Done" : "Mark as done"}
        </label>
        {rate !== null && (
          <label className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm text-fg-muted transition-ui hover:bg-surface-muted max-lg:ml-auto">
            <Gauge className="size-4" aria-hidden />
            <span className="sr-only">Playback speed</span>
            <select
              value={rate}
              onChange={(e) => onRate(Number(e.target.value))}
              className="cursor-pointer bg-transparent text-base font-medium tabular-nums text-fg focus-visible:outline-none sm:text-sm"
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
          className="ml-auto h-11 px-4 max-lg:hidden"
          onClick={onNext}
          disabled={!hasNext}
        >
          Next <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/** Phone-only bottom bar: previous and next where the thumb already is. */
export function LectureNavBar({
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: Pick<Props, "hasPrev" | "hasNext" | "onPrev" | "onNext">) {
  return (
    <nav
      aria-label="Lecture navigation"
      className="flex shrink-0 gap-2 border-t border-border bg-surface px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:hidden"
    >
      <Button variant="outline" className="h-11 flex-1" onClick={onPrev} disabled={!hasPrev}>
        <ChevronLeft aria-hidden /> Previous
      </Button>
      <Button className="h-11 flex-1" onClick={onNext} disabled={!hasNext}>
        Next lecture <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
