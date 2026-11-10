"use client";

import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

export interface AdminFilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** One labelled row of filter chips. The selected chip is filled violet and has aria-pressed. */
export function AdminFilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: AdminFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("flex min-w-0 items-center gap-2", className)}>
      <legend className="sr-only">{label}</legend>
      <span aria-hidden className="shrink-0 text-sm text-fg-muted">
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1">
        {options.map((opt) => (
          <Chip
            key={opt.value}
            size="sm"
            selected={value === opt.value}
            count={opt.count}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
