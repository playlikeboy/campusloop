"use client";

import type * as React from "react";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { FormOption } from "./event-form-options";

export function FormSection({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-lg border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-fg">{title}</h2>
          {hint && <p className="text-sm text-fg-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Radio group drawn as tiles. Uses native radios, so arrow keys and screen readers work. */
export function OptionTiles<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  columns = "sm:grid-cols-3",
}: {
  name: string;
  legend: string;
  options: FormOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-fg">{legend}</legend>
      <div className={cn("mt-2 grid grid-cols-1 gap-2", columns)}>
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-surface p-3 transition-ui",
                "hover:bg-surface-muted has-[input:checked]:border-brand has-[input:checked]:bg-brand-subtle",
                "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring"
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => {
                  onChange(opt.value);
                  haptics.light();
                }}
                className="sr-only"
              />
              <Icon aria-hidden="true" className="size-5 shrink-0 text-fg-muted" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{opt.label}</span>
                <span className="block text-xs text-fg-muted">{opt.desc}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
