import type * as React from "react";

import { cn } from "@/lib/utils";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Secondary line under the number, e.g. "+12 this week". */
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "brand" | "reward" | "success" | "danger";
  size?: "sm" | "md" | "lg";
}

const TONES = {
  default: "text-fg",
  brand: "text-brand-text",
  reward: "text-reward-text",
  success: "text-success",
  danger: "text-danger",
} as const;

const VALUE_SIZES = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" } as const;

/** Label plus a tabular number. Composes inside a Card or a grid of stats. */
export function Stat({ label, value, hint, icon, tone = "default", size = "md", className, ...props }: StatProps) {
  return (
    <div data-slot="stat" className={cn("flex min-w-0 flex-col gap-1", className)} {...props}>
      <div className="flex items-center gap-1.5 text-sm text-fg-muted">
        {icon && <span className="flex shrink-0 [&_svg]:size-4">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <p className={cn("font-semibold tracking-tight tabular-nums", VALUE_SIZES[size], TONES[tone])}>{value}</p>
      {hint && <p className="text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}
