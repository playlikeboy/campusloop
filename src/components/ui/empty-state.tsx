import type * as React from "react";

import { CuteCatEmpty } from "@/components/ui/cute-illustrations";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ComponentType<{ className?: string }>;
  illustration?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** One action, usually a primary Button. */
  action?: React.ReactNode;
  /** `compact` drops the illustration and tightens padding for inline lists. */
  size?: "default" | "compact";
  /** Draw a dashed boundary; off inside Cards and list columns. */
  bordered?: boolean;
}

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
  const visual = illustration ? (
    illustration
  ) : Icon ? (
    <div className="flex size-14 items-center justify-center rounded-lg bg-surface-muted text-fg-muted">
      <Icon className="size-6" />
    </div>
  ) : compact ? null : (
    <CuteCatEmpty size={96} />
  );

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-6 py-8" : "gap-3 px-8 py-12 sm:py-16",
        bordered && "rounded-lg border border-dashed border-border",
        className
      )}
      {...props}
    >
      {visual && <div className="mb-1">{visual}</div>}
      <div className="space-y-1">
        <h3 className={cn("font-semibold tracking-tight text-fg", compact ? "text-base" : "text-lg")}>{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm leading-relaxed text-fg-muted">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
