import { CheckCircle2, MapPin, ShieldCheck, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StatusBadge primitive: Pills are reserved strictly for status, categories, and filters.
 */
export function StatusBadge({
  status,
  variant = "neutral",
  size = "md",
  className,
}: {
  status: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary";
  size?: "sm" | "md";
  className?: string;
}) {
  const variantStyles = {
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    info: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
    neutral: "bg-muted text-muted-foreground border-border/50",
    primary: "bg-primary/15 text-primary border-primary/30",
  }[variant];

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-bold rounded-full border uppercase tracking-wider shrink-0 select-none",
        variantStyles,
        sizeStyles,
        className
      )}
    >
      {status}
    </span>
  );
}

/**
 * PriceMeta primitive: Renders clear bold pricing without microscopic typography.
 */
export function PriceMeta({
  amount,
  period,
  isNegotiable,
  className,
}: {
  amount: number | string;
  period?: string;
  isNegotiable?: boolean;
  className?: string;
}) {
  const formatted = typeof amount === "number" ? `₹${amount.toLocaleString("en-IN")}` : amount;

  return (
    <div className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className="text-lg sm:text-xl font-black text-foreground tracking-tight">
        {formatted}
      </span>
      {period && (
        <span className="text-xs text-muted-foreground font-medium">
          /{period}
        </span>
      )}
      {isNegotiable && (
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
          Negotiable
        </span>
      )}
    </div>
  );
}

/**
 * LocationMeta primitive: Spatial distance and campus location information.
 */
export function LocationMeta({
  location,
  distance,
  className,
}: {
  location: string;
  distance?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground font-medium truncate", className)}>
      <MapPin className="size-3.5 text-primary shrink-0" />
      <span className="truncate">{location}</span>
      {distance && (
        <>
          <span className="text-border shrink-0">·</span>
          <span className="text-foreground/80 font-semibold shrink-0">{distance}</span>
        </>
      )}
    </div>
  );
}

/**
 * StudentTrustBadge: Verified student network status indicator.
 */
export function StudentTrustBadge({
  collegeName,
  verified = true,
  className,
}: {
  collegeName?: string;
  verified?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground", className)}>
      {verified && <ShieldCheck className="size-3.5 text-primary shrink-0" />}
      <span className="truncate">{collegeName || "Verified Student"}</span>
    </div>
  );
}
