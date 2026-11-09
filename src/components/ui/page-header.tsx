import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** The one primary Button for the view. */
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  /** Tabs or filters rendered beneath the title row. */
  children?: React.ReactNode;
  /** Renders a back link to this href before the title. */
  backHref?: string;
  backLabel?: string;
  /** Hairline under the header; off when tabs supply their own. */
  divider?: boolean;
  size?: "md" | "lg";
}

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
  children,
  backHref,
  backLabel = "Back",
  divider = true,
  size = "lg",
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className={cn("flex flex-col gap-3", divider && "border-b border-border", size === "lg" ? "pb-4 sm:pb-6" : "pb-3", className)}
      {...props}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="-ml-2 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors outline-none hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <ArrowLeft className="size-5" />
            </Link>
          )}
          <div className="min-w-0 space-y-1">
            <h1
              className={cn(
                "break-words font-semibold tracking-tight text-fg",
                size === "lg" ? "text-2xl sm:text-3xl" : "text-xl"
              )}
            >
              {title}
            </h1>
            {description && <p className="max-w-2xl text-sm leading-relaxed text-fg-muted">{description}</p>}
          </div>
        </div>
        {(primaryAction || secondaryActions) && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
