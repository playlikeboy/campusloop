import { StoryProgress } from "@/components/ui/stickers";

/** Most lectures we split into story segments; longer courses get one continuous bar. */
const MAX_SEGMENTS = 24;

/**
 * Course progress as story bars. With `done` + `total` (lecture counts) and a short
 * course, each lecture is one segment; otherwise a single bar fills to `value`%.
 */
export function ProgressBar({
  value,
  label,
  done,
  total,
  className,
}: {
  value: number;
  label: string;
  done?: number;
  total?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const segmented = typeof done === "number" && typeof total === "number" && total > 1 && total <= MAX_SEGMENTS;
  return (
    <StoryProgress
      count={segmented ? total : 1}
      current={segmented ? Math.min(done, total) : 0}
      progress={segmented ? 0 : pct / 100}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={segmented ? `${Math.min(done, total)} of ${total} lectures done` : `${pct}% done`}
      className={className}
    />
  );
}
