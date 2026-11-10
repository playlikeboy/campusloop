"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GUEST_DOWNLOAD_LIMIT } from "@/lib/academic-download-limiter";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AcademicAuthBenefitsCardProps {
  returnTo?: string;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const DISMISS_KEY = "campusloop_dismissed_academic_perks";

/** Small sign-in nudge for guests. Dismissal is remembered on this device. */
export function AcademicAuthBenefitsCard({
  returnTo,
  className,
  dismissible = true,
  onDismiss,
}: AcademicAuthBenefitsCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!dismissible) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "true") setIsDismissed(true);
    } catch {
      // Storage blocked: show the card.
    }
  }, [dismissible]);

  function handleDismiss() {
    sounds.tap();
    haptics.light();
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Storage blocked: dismiss for this visit only.
    }
    onDismiss?.();
  }

  if (!isMounted || isDismissed) return null;

  const signInUrl = `/sign-in${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className={cn("min-w-0 space-y-0.5", dismissible && "pr-10 sm:pr-0")}>
        <p className="font-semibold text-fg">Sign in to save notes and download more</p>
        <p className="text-sm text-fg-muted">
          Guests get {GUEST_DOWNLOAD_LIMIT} free downloads. Use your college email to sign in.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild size="sm">
          <Link href={signInUrl} onClick={() => sounds.tap()}>
            Sign in
          </Link>
        </Button>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Hide this message"
            className="absolute top-2 right-2 flex size-10 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg sm:static"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
