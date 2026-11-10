"use client";

import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  count?: number;
  icon?: React.ReactNode;
  /** Renders a trailing remove control; the chip itself stays a toggle. */
  onRemove?: () => void;
  size?: "sm" | "md";
}

/** Selectable pill for filters and tags. Selected fills violet (it is a pressable choice); rows of chips never carry a border. */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      selected = false,
      onSelectedChange,
      count,
      icon,
      onRemove,
      size = "md",
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const tone = selected
      ? "bg-brand text-brand-fg"
      : "bg-surface-muted text-fg-muted hover:bg-surface-sunken hover:text-fg";
    const height = size === "sm" ? "h-8 pointer-coarse:h-11 text-xs" : "h-10 pointer-coarse:h-11 text-sm";
    const focus =
      "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

    const toggle = (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        data-selected={selected ? "true" : undefined}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) onSelectedChange?.(!selected);
        }}
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap select-none",
          "transition-ui active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
          focus,
          height,
          onRemove ? "pr-1 pl-3" : cn(tone, size === "sm" ? "px-3" : "px-4"),
          "[&_svg]:pointer-events-none [&_svg]:shrink-0",
          !onRemove && className
        )}
        {...props}
      >
        {icon && <span className="flex [&_svg]:size-3.5">{icon}</span>}
        <span>{children}</span>
        {typeof count === "number" && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
              selected ? "bg-brand-fg/20 text-brand-fg" : "bg-surface text-fg-muted"
            )}
          >
            {count}
          </span>
        )}
      </button>
    );

    if (!onRemove) return toggle;

    // Two sibling buttons inside one pill, so the remove control is never
    // nested inside the toggle button.
    return (
      <span className={cn("inline-flex shrink-0 items-center rounded-full transition-ui", tone, className)}>
        {toggle}
        <button
          type="button"
          aria-label={typeof children === "string" ? `Remove ${children}` : "Remove"}
          onClick={onRemove}
          className={cn(
            "mr-0.5 flex size-8 cursor-pointer items-center justify-center rounded-full pointer-coarse:size-11 hover:bg-fg/10",
            focus
          )}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </span>
    );
  }
);
Chip.displayName = "Chip";
