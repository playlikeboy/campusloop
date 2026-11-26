"use client";

import { BadgeCheck, School, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "campusloop_verify_banner_dismissed_at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Banner for unverified members. Profiles still in the legacy Campus Preview
 * hub are asked to pick their college (never moved automatically); everyone
 * else gets a dismissible nudge to verify their student status.
 */
export function PreviewModeBanner({ pickCollege = false }: { pickCollege?: boolean }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (pickCollege) {
      setDismissed(false);
      return;
    }
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      setDismissed(Date.now() - at < DISMISS_MS);
    } catch {
      setDismissed(false);
    }
  }, [pickCollege]);

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Blocked storage: hidden for this visit only.
    }
  }

  return (
    <div className="mx-3 my-2 flex min-h-11 items-center gap-2 rounded-md bg-verified-subtle py-2 pr-1 pl-3 text-sm text-fg sm:mx-0 sm:mt-0 sm:mb-4">
      {pickCollege ? (
        <School className="size-4 shrink-0 text-verified-text" aria-hidden="true" />
      ) : (
        <BadgeCheck className="size-4 shrink-0 text-verified-text" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1">
        {pickCollege
          ? "Pick your college to join its campus feed. "
          : "Verify your student status to get the verified badge and unlock everything. "}
        <Link
          href={pickCollege ? "/settings/verify#college" : "/settings/verify"}
          className="font-semibold text-brand-text underline underline-offset-4"
        >
          {pickCollege ? "Pick your college" : "Verify now"}
        </Link>
      </span>
      {!pickCollege && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide for a week"
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
