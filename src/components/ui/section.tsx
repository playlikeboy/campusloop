import type * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: React.ReactNode;
  /** Old name kept; same slot as `description`. */
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  /** Heading level; sections default to h2, standalone page heads use h1. */
  as?: "h1" | "h2" | "h3";
  className?: string;
}

export function SectionHeader({ title, subtitle, description, badge, action, as: Heading = "h2", className }: SectionHeaderProps) {
  const sub = description ?? subtitle;
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Heading className={cn("font-semibold tracking-tight text-fg", Heading === "h1" ? "text-2xl" : "text-xl")}>
            {title}
          </Heading>
          {badge}
        </div>
        {sub && <p className="mt-0.5 text-sm leading-relaxed text-fg-muted">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title">, Omit<SectionHeaderProps, "className"> {
  headerClassName?: string;
  /** Space between header and content. */
  spacing?: "sm" | "md" | "lg";
}

const SPACING = { sm: "gap-3", md: "gap-4", lg: "gap-6" } as const;

/** Titled block of a page: one header row, then content. More space above than below. */
export function Section({
  title,
  subtitle,
  description,
  badge,
  action,
  as,
  headerClassName,
  spacing = "md",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section data-slot="section" className={cn("flex flex-col", SPACING[spacing], className)} {...props}>
      {title && (
        <SectionHeader
          title={title}
          subtitle={subtitle}
          description={description}
          badge={badge}
          action={action}
          as={as}
          className={headerClassName}
        />
      )}
      {children}
    </section>
  );
}
