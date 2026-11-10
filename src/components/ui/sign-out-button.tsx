"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
  /**
   * "button" renders a kit Button (pick its look with `buttonVariant`),
   * "icon" a 44px icon button, "menu-item" a full-width row for menus.
   */
  variant?: "icon" | "button" | "menu-item";
  buttonVariant?: ButtonVariant;
  size?: ButtonSize;
  showText?: boolean;
}

export function SignOutButton({
  className,
  children,
  variant = "button",
  buttonVariant = "outline",
  size = "md",
  showText = true,
}: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  function handleSignOut(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = "/logout";
  }

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        loading={isSigningOut}
        className={cn("text-fg-muted hover:text-danger", className)}
        aria-label="Sign out"
      >
        {!isSigningOut && <LogOut aria-hidden />}
      </Button>
    );
  }

  if (variant === "menu-item") {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={handleSignOut}
        loading={isSigningOut}
        className={cn(
          "w-full justify-start rounded-md px-3 font-medium text-danger hover:bg-danger-subtle",
          className
        )}
      >
        {!isSigningOut && <LogOut aria-hidden />}
        {children || <span>Sign out</span>}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={buttonVariant}
      size={size}
      onClick={handleSignOut}
      loading={isSigningOut}
      className={className}
    >
      {!isSigningOut && <LogOut aria-hidden />}
      {children || (showText ? <span>Sign out</span> : null)}
    </Button>
  );
}
