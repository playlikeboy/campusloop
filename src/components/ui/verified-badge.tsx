import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VerifiedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md";
  title?: string;
}

export function VerifiedBadge({
  size = "md",
  title = "Verified Student",
  className,
  ...props
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "size-3.5 [&>svg]:size-2.5",
    md: "size-4 [&>svg]:size-3",
  }[size];

  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[var(--primary)] text-white shrink-0 select-none",
        sizeClasses,
        className
      )}
      {...props}
    >
      <Check strokeWidth={3} className="text-white" />
    </span>
  );
}
