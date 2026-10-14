import React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 sm:py-6 border-b border-[var(--border)] mb-6",
        className
      )}
      {...props}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="break-words font-heading font-bold text-2xl sm:text-3xl tracking-tight text-[var(--text)]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(primaryAction || secondaryActions) && (
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:shrink-0">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
