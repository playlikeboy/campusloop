import { cn } from "@/lib/utils";

/** Progress bar: an ink fill that grows across the poll track (poll-fill motion). */
export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 overflow-hidden rounded-full bg-poll-track", className)}
    >
      <div
        className="poll-fill h-full w-full rounded-full bg-fg"
        style={{ "--fill": pct } as React.CSSProperties}
      />
    </div>
  );
}
