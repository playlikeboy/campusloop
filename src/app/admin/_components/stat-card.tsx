import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: "primary" | "blue" | "green" | "orange" | "red" | "violet";
  href?: string;
  hint?: string;
  trend?: string;
  status?: "healthy" | "attention" | "critical" | "neutral";
};

const accents: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  green: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  red: "bg-destructive/10 text-destructive border-destructive/20",
  violet: "bg-violet-500/10 text-violet-500 border-violet-500/20",
};

const statusStyles = {
  healthy: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  attention: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  critical: "text-destructive bg-destructive/10 border-destructive/20",
  neutral: "text-muted-foreground bg-muted/60 border-border/40",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  href,
  hint,
  trend,
  status,
}: StatCardProps) {
  const content = (
    <div className="rounded-xl border border-border/60 bg-card/70 hover:bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between gap-2.5 transition-all hover:border-primary/40 h-full group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </span>
        <div
          className={cn(
            "rounded-lg p-1.5 border shrink-0 transition-transform group-hover:scale-105",
            accents[accent]
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
          {value}
        </div>

        <div className="flex items-center justify-between gap-1.5 flex-wrap pt-0.5">
          {hint && (
            <span className="text-[11px] text-muted-foreground truncate leading-none">
              {hint}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.2 rounded border leading-tight shrink-0",
                status ? statusStyles[status] : "text-muted-foreground bg-muted border-border/40"
              )}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
      {content}
    </Link>
  ) : (
    content
  );
}
