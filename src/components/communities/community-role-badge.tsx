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
          "bg-warning-subtle text-warning border border-warning",
          className
        )}
      >
        <Crown className="size-3 text-warning shrink-0" />
        <span>Admin</span>
      </span>
    );
  }

  if (normalized === "MODERATOR") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs",
          "bg-brand-subtle text-brand-text border border-brand",
          className
        )}
      >
        <ShieldCheck className="size-3 text-brand-text shrink-0" />
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
