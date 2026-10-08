"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  "aria-label": string;
  tooltip?: string;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, tooltip, size = "md", "aria-label": ariaLabel, variant = "ghost", icon, children, ...props }, ref) => {
    const sizeMap = {
      sm: "icon-sm",
      md: "icon",
      lg: "icon-lg",
    } as const;

    return (
      <Button
        ref={ref}
        variant={variant}
        size={sizeMap[size] || "icon"}
        aria-label={ariaLabel}
        title={tooltip || ariaLabel}
        className={cn("shrink-0 cursor-pointer", className)}
        {...props}
      >
        {icon || children}
      </Button>
    );
  }
);

IconButton.displayName = "IconButton";
