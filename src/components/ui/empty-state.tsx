import type * as React from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ComponentType<{ className?: string }>;
  illustration?: React.ReactNode;
  /** One short, friendly line: what is empty. */
  title: React.ReactNode;
  /** Optional second line: what to do next. Keep it to one sentence. */
  description?: React.ReactNode;
  /** One action, usually a primary Button. */
  action?: React.ReactNode;
  /** `compact` tightens padding for inline lists. */
  size?: "default" | "compact";
  /** Draw a dashed boundary; off inside Cards and list columns. */
  bordered?: boolean;
}

/** Empty list / no results. One line, one action. No mascots, no paragraphs. */
export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  size = "default",
  bordered = false,
  className,
  ...props
}: EmptyStateProps) {
  const compact = size === "compact";
  const visual =
    illustration ??
    (Icon ? (
      <div
        className={cn(
          "flex items-center justify-center rounded-sticker bg-brand-subtle text-brand-text",
          compact ? "size-11" : "size-14"
        )}
      >
        <Icon className={compact ? "size-5" : "size-6"} />
      </div>
    ) : null);

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-6 py-8" : "gap-3 px-6 py-12 sm:py-16",
        bordered && "rounded-lg border border-dashed border-border-strong",
        className
      )}
      {...props}
    >
      {visual}
      <div className="space-y-1">
        <h3 className={cn("font-display font-bold text-fg", compact ? "text-base" : "text-xl")}>{title}</h3>
        {description && <p className="mx-auto max-w-xs text-sm text-fg-muted">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
