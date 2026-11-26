import { BadgeCheck } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export interface VerifiedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "xs" | "sm" | "md" | "lg";
  title?: string;
  /** "halo" (default) sits the tick on a soft mint ring so it reads at a glance. "plain" is the bare tick. */
  tone?: "halo" | "plain";
}

export function VerifiedBadge({
  size = "md",
  title = "Verified student",
  tone = "halo",
  className,
  ...props
}: VerifiedBadgeProps) {
  const sizeClasses = {
    xs: "size-3",
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
  }[size];

  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center",
        tone === "halo" && "rounded-full bg-verified-subtle p-0.5 ring-1 ring-verified/40",
        className
      )}
      {...props}
    >
      <BadgeCheck className={cn(sizeClasses, "fill-verified text-verified-fg")} />
    </span>
  );
}
