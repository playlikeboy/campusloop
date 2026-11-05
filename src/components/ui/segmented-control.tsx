"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type * as React from "react";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  /** Stretch segments to fill the container. */
  fullWidth?: boolean;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}

/** Single-select pill group. Exactly one segment is always selected. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  fullWidth,
  className,
  disabled,
  ...aria
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0] as T | undefined;
        if (picked !== undefined) onChange(picked);
      }}
      disabled={disabled}
      aria-label={aria["aria-label"]}
      data-slot="segmented-control"
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-surface-muted p-1",
        fullWidth && "flex w-full",
        className
      )}
    >
      {options.map((opt) => (
        <Toggle
          key={opt.value}
          value={opt.value}
          disabled={opt.disabled}
          className={cn(
            "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm font-semibold whitespace-nowrap text-fg-muted select-none",
            "transition-colors outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            "hover:text-fg data-[pressed]:bg-surface data-[pressed]:text-fg data-[pressed]:shadow-xs disabled:pointer-events-none disabled:opacity-50",
            size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
            fullWidth && "flex-1",
            "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          )}
        >
          {opt.icon}
          {opt.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
