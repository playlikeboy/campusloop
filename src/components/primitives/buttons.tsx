"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";
import { haptics } from "@/lib/haptics";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Standardized CampusLoop 2.0 Button Primitives
 * Eliminates the "pill everything" problem: Uses cohesive 10-14px radii (rounded-xl),
 * distinct hierarchy, full keyboard focus rings, and tactile spring scaling.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      onClick,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;
      sounds.tap();
      haptics.light();
      onClick?.(e);
    };

    const variantStyles = {
      primary:
        "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95 border border-primary/20",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90 border border-border/30",
      outline:
        "border border-border/60 bg-card hover:bg-muted/50 hover:text-foreground text-foreground/90 active:bg-muted/70",
      ghost:
        "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 shadow-xs",
    }[variant];

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
      md: "h-10 px-4 text-sm gap-2 rounded-xl",
      lg: "h-12 px-6 text-base gap-2.5 rounded-xl font-bold",
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
