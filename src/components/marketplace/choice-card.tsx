"use client";

import type * as React from "react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface ChoiceCardProps {
  selected: boolean;
  onSelect: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  className?: string;
}

/** One option in a pick-one group (delivery or pickup, payment method). Selected = violet outline. */
export function ChoiceCard({ selected, onSelect, icon: Icon, title, hint, className }: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        sounds.tap();
        haptics.light();
        onSelect();
      }}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-brand bg-brand-subtle text-fg"
          : "border-border bg-surface text-fg hover:bg-surface-muted",
        className
      )}
    >
      {Icon && <Icon className={cn("size-5 shrink-0", selected ? "text-brand-text" : "text-fg-muted")} />}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        {hint && <span className="block text-xs text-fg-muted">{hint}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-brand" : "border-border-strong"
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-brand" />}
      </span>
    </button>
  );
}
