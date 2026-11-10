"use client";

import { Minus, Plus } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (delta: 1 | -1) => void;
  label: string;
  className?: string;
}

/** Minus / count / plus. Each button is a 44px touch target. */
export function QuantityStepper({ value, onChange, label, className }: QuantityStepperProps) {
  const step = (d: 1 | -1) => {
    sounds.tap();
    haptics.light();
    onChange(d);
  };
  const btn =
    "flex size-11 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className={cn("flex shrink-0 items-center rounded-full bg-surface-muted", className)}>
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label={value <= 1 ? `Remove ${label}` : `One less ${label}`}
        className={btn}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="min-w-6 text-center text-sm font-semibold text-fg tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => step(1)} aria-label={`One more ${label}`} className={btn}>
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
