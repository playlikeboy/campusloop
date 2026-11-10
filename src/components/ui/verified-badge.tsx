import { BadgeCheck } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export interface VerifiedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "xs" | "sm" | "md" | "lg";
  title?: string;
}

export function VerifiedBadge({
  size = "md",
  title = "Verified student",
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
      <BadgeCheck className={cn(sizeClasses, "fill-verified text-verified-fg")} />
    </span>
  );
}
