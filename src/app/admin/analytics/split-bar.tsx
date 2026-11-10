import type { LucideIcon } from "lucide-react";

interface SplitBarProps {
  title: string;
  description: string;
  icon: LucideIcon;
  left: { label: string; value: number };
  right: { label: string; value: number };
}

/** Two-part share bar (e.g. anonymous vs named posts). Plain counts underneath, no decoration. */
export function SplitBar({ title, description, icon: Icon, left, right }: SplitBarProps) {
  const total = left.value + right.value;
  const leftPct = total > 0 ? Math.round((left.value / total) * 100) : 0;
  const rightPct = total > 0 ? 100 - leftPct : 0;

  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <div>
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
          <Icon className="size-4 text-fg-muted" aria-hidden />
          {title}
        </h2>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
      {total === 0 ? (
        <p className="text-sm text-fg-muted">No data yet.</p>
      ) : (
        <>
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-poll-track"
            role="img"
            aria-label={`${left.label} ${leftPct}%, ${right.label} ${rightPct}%`}
          >
            <div className="h-full bg-poll-fill-chosen" style={{ width: `${leftPct}%` }} />
          </div>
          <div className="flex justify-between gap-3 text-sm tabular-nums">
            <span className="text-fg">
              {left.label} · {leftPct}%{" "}
              <span className="text-fg-muted">({left.value.toLocaleString("en-IN")})</span>
            </span>
            <span className="text-right text-fg">
              {right.label} · {rightPct}%{" "}
              <span className="text-fg-muted">({right.value.toLocaleString("en-IN")})</span>
            </span>
          </div>
        </>
      )}
    </section>
  );
}
