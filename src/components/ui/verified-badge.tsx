import React from "react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VerifiedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "xs" | "sm" | "md" | "lg";
  title?: string;
}

export function VerifiedBadge({
  size = "md",
  title = "Verified Student (College Email)",
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
      className={cn("inline-flex items-center justify-center shrink-0 select-none", className)}
      {...props}
    >
      <BadgeCheck className={cn(sizeClasses, "text-[#1D9BF0] fill-[#1D9BF0]/20")} />
    </span>
  );
}
