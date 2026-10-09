import React from "react";
import { Crown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommunityRoleBadgeProps {
  role?: string | null;
  className?: string;
  showMember?: boolean;
}

/**
 * CommunityRoleBadge displays member roles (Admin, Moderator, Member)
 * with a crisp, clear border and high contrast text (WCAG AA compliant).
 */
export function CommunityRoleBadge({
  role,
  className,
  showMember = true,
}: CommunityRoleBadgeProps) {
  const normalized = (role || "MEMBER").toUpperCase();

  if (normalized === "ADMIN") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs",
          "bg-amber-500/10 text-amber-950 dark:text-amber-200 border border-amber-500/50",
          className
        )}
      >
        <Crown className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Admin</span>
      </span>
    );
  }

  if (normalized === "MODERATOR") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs",
          "bg-sky-500/10 text-sky-950 dark:text-sky-200 border border-sky-500/50",
          className
        )}
      >
        <ShieldCheck className="size-3 text-sky-600 dark:text-sky-400 shrink-0" />
        <span>Moderator</span>
      </span>
    );
  }

  if (!showMember) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs",
        "bg-muted/70 text-foreground border border-border/80",
        className
      )}
    >
      <span>Member</span>
    </span>
  );
}
