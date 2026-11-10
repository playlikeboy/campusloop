import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  key: string;
  label: string;
  desc: string;
}

/** Vertical step list. Done steps are mint, the current step is ink, later steps are hollow. */
export function StatusTimeline({ steps, current }: { steps: TimelineStep[]; current: string }) {
  const index = Math.max(
    0,
    steps.findIndex((s) => s.key === current)
  );
  const last = steps.length - 1;
  return (
    <ol className="space-y-4">
      {steps.map((step, idx) => {
        const done = idx < index || (idx === index && idx === last);
        const isCurrent = idx === index && !done;
        return (
          <li
            key={step.key}
            className="relative flex items-start gap-3"
            aria-current={isCurrent ? "step" : undefined}
          >
            {idx < last && (
              <span
                aria-hidden="true"
                className={cn("absolute top-7 left-3 h-5 w-0.5", idx < index ? "bg-success" : "bg-border")}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full",
                done && "bg-success text-success-fg",
                isCurrent && "bg-fg text-bg",
                !done && !isCurrent && "border border-border-strong bg-surface"
              )}
            >
              {done && <Check className="size-3.5" />}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm",
                  isCurrent ? "font-semibold text-fg" : done ? "text-fg" : "text-fg-muted"
                )}
              >
                {step.label}
                {done && idx < index ? <span className="sr-only"> (done)</span> : null}
              </p>
              {(isCurrent || (done && idx === last)) && <p className="text-sm text-fg-muted">{step.desc}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
