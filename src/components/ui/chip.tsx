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

/** Selectable pill for filters and tags. Selected = brand-subtle; one row of them never carries a border. */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected = false, onSelectedChange, count, icon, onRemove, size = "md", className, children, onClick, ...props }, ref) => {
    return (
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
          "transition-colors outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          selected ? "bg-brand-subtle text-brand-text" : "bg-surface-muted text-fg-muted hover:bg-surface-sunken hover:text-fg",
          size === "sm" ? "h-7 px-3 text-xs" : "h-9 px-4 text-sm",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0",
          className
        )}
        {...props}
      >
        {icon && <span className="flex [&_svg]:size-3.5">{icon}</span>}
        <span>{children}</span>
        {typeof count === "number" && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
              selected ? "bg-brand text-brand-fg" : "bg-surface text-fg-muted"
            )}
          >
            {count}
          </span>
        )}
        {onRemove && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }
            }}
            className="-mr-1 flex size-5 items-center justify-center rounded-full outline-none hover:bg-fg/10 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" />
          </span>
        )}
      </button>
    );
  }
);
Chip.displayName = "Chip";
