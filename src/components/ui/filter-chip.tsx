import React from "react";
import { cn } from "@/lib/utils";

export interface FilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function FilterChip({
  active = false,
  count,
  size = "md",
  className,
  children,
  ...props
}: FilterChipProps) {
  const sizeClasses = {
    sm: "h-7 px-3 text-xs gap-1.5",
    md: "h-8 sm:h-9 px-3.5 sm:px-4 text-xs sm:text-sm gap-2",
  }[size];

  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-full transition-all shrink-0 select-none cursor-pointer border",
        sizeClasses,
        active
          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
          : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)] hover:border-[var(--border-strong)]",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors",
            active
              ? "bg-white/20 text-white"
              : "bg-[var(--surface-sunken)] text-[var(--text-muted)]"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
