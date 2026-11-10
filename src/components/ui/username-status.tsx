"use client";

import { AlertCircle, Check, Loader2, X } from "lucide-react";
import type { UsernameStatus } from "@/hooks/use-username-availability";
import { cn } from "@/lib/utils";

/**
 * Inline availability readout for a username field, shared by onboarding and
 * profile editing so both read identically.
 */
export function UsernameStatusHint({ status, className }: { status: UsernameStatus; className?: string }) {
  if (status.state === "idle") return null;

  const base = cn("flex items-center gap-1 text-xs font-semibold", className);

  switch (status.state) {
    case "checking":
      return (
        <span className={cn(base, "text-fg-muted")}>
          <Loader2 className="size-3 motion-safe:animate-spin" aria-hidden />
          Checking
        </span>
      );

    case "available":
      return (
        <span className={cn(base, "text-success")}>
          <Check className="size-3" />
          {status.isCurrent ? "Your current username" : "Available"}
        </span>
      );

    case "taken":
      return (
        <span className={cn(base, "text-danger")}>
          <X className="size-3" />
          {status.reason}
        </span>
      );

    case "invalid":
      return (
        <span className={cn(base, "text-danger")}>
          <AlertCircle className="size-3" />
          {status.reason}
        </span>
      );

    case "error":
      return (
        <span className={cn(base, "text-fg-muted")}>
          <AlertCircle className="size-3" />
          Could not check right now
        </span>
      );
  }
}

/** True when the field must block submission. */
export function isUsernameBlocking(status: UsernameStatus): boolean {
  return status.state === "taken" || status.state === "invalid" || status.state === "checking";
}
