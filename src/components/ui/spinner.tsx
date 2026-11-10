import { Loader2 } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-8",
} as const;

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: keyof typeof SIZES;
  /** Read by screen readers; defaults to a generic loading label. */
  label?: string;
}

export function Spinner({ size = "sm", label = "Loading", className, ...props }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      data-slot="spinner"
      className={cn("shrink-0 animate-spin text-current", SIZES[size], className)}
      {...props}
    />
  );
}
