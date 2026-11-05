import type { ReactNode } from "react";
import { Reveal } from "@/components/landing/reveal";
import { cn } from "@/lib/utils";

// Legacy marketing primitives kept for src/components/marketing/system.tsx. Colours map to tokens; API unchanged.

export interface LandingSectionProps {
  id?: string;
  bg?: "default" | "subtle" | "elevated";
  className?: string;
  children: ReactNode;
}

export function LandingSection({ id, bg = "default", className, children }: LandingSectionProps) {
  const bgClasses = {
    default: "bg-bg",
    subtle: "bg-surface-muted",
    elevated: "bg-surface-sunken",
  }[bg];

  return (
    <section
      id={id}
      className={cn("relative border-t border-border py-12 sm:py-20 lg:py-24 px-[var(--gutter)] overflow-x-clip", bgClasses, className)}
    >
      {children}
    </section>
  );
}

export interface LandingContainerProps {
  className?: string;
  children: ReactNode;
}

export function LandingContainer({ className, children }: LandingContainerProps) {
  return <div className={cn("mx-auto w-full max-w-6xl space-y-16", className)}>{children}</div>;
}

export interface LandingSectionHeaderProps {
  badge?: string;
  eyebrow?: string;
  headlineMain: string;
  headlineSub?: string;
  headlineHighlight?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function LandingSectionHeader({
  badge,
  eyebrow,
  headlineMain,
  headlineSub,
  headlineHighlight,
  description,
  align = "left",
  className,
}: LandingSectionHeaderProps) {
  const isCenter = align === "center";
  // An eyebrow is folded into the heading's lead line rather than set above it.
  const lead = badge ?? eyebrow;

  return (
    <Reveal className={cn("space-y-4", isCenter && "text-center max-w-2xl mx-auto", className)}>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-fg leading-[1.1]">
        {headlineMain}
        {headlineSub && <span className="block text-fg-muted font-medium mt-1">{headlineSub}</span>}
        {headlineHighlight && <span className="block mt-1">{headlineHighlight}</span>}
      </h2>

      {(description || lead) && (
        <p className={cn("text-base sm:text-lg text-fg-muted leading-relaxed", isCenter ? "max-w-xl mx-auto" : "max-w-2xl")}>
          {lead && <span className="font-semibold text-fg">{lead}. </span>}
          {description}
        </p>
      )}
    </Reveal>
  );
}

export interface LandingBadgeProps {
  className?: string;
  variant?: "default" | "success" | "neutral" | "warning";
  dot?: boolean;
  children: ReactNode;
}

export function LandingBadge({ className, variant = "default", children }: LandingBadgeProps) {
  const variantStyles = {
    default: "bg-brand-subtle text-brand-text border-brand-subtle-border",
    success: "bg-success-subtle text-success border-success/30",
    neutral: "bg-surface-muted text-fg-muted border-border",
    warning: "bg-warning-subtle text-warning border-warning/30",
  }[variant];

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold", variantStyles, className)}>
      {children}
    </span>
  );
}

export interface LandingCardProps {
  className?: string;
  hoverable?: boolean;
  children: ReactNode;
}

export function LandingCard({ className, hoverable = true, children }: LandingCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl bg-surface p-4 sm:p-6 lg:p-8 shadow-sm transition-[transform,box-shadow] duration-300 motion-reduce:transition-none",
        hoverable && "hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface StatusPillProps {
  status: "live" | "paused" | "critical" | "healthy" | "pending";
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const configs = {
    live: { bg: "bg-success-subtle text-success border-success/30", text: label || "Live" },
    healthy: { bg: "bg-success-subtle text-success border-success/30", text: label || "Healthy" },
    paused: { bg: "bg-warning-subtle text-warning border-warning/30", text: label || "Paused" },
    pending: { bg: "bg-brand-subtle text-brand-text border-brand-subtle-border", text: label || "Pending" },
    critical: { bg: "bg-danger-subtle text-danger border-danger/30", text: label || "Critical" },
  }[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-sm font-medium", configs.bg, className)}>
      {configs.text}
    </span>
  );
}
