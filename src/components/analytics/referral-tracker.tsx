"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { parseUtm, utmRefCode } from "@/lib/referrals/utm";

function logClick(ref: string) {
  // Non-blocking fire & forget
  fetch("/api/referrals/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ref,
      referer: typeof document !== "undefined" ? document.referrer : null,
    }),
  }).catch(() => {});
}

/** Logs `?ref=` and `utm_*` arrivals once per value, so we know which link or reel sent a visitor. */
export function ReferralTracker() {
  const searchParams = useSearchParams();
  const trackedRef = useRef<string | null>(null);
  const trackedUtm = useRef<string | null>(null);

  useEffect(() => {
    const ref = searchParams?.get("ref")?.trim();
    if (ref && trackedRef.current !== ref) {
      trackedRef.current = ref;
      try {
        localStorage.setItem("campusloop_ref", ref);
      } catch {}
      logClick(ref);
    }

    const utm = searchParams ? parseUtm(searchParams) : null;
    const code = utm ? utmRefCode(utm) : null;
    if (code && trackedUtm.current !== code) {
      trackedUtm.current = code;
      try {
        // First touch wins: the campaign that first brought this browser here.
        if (!localStorage.getItem("cl_first_utm")) localStorage.setItem("cl_first_utm", code);
        if (sessionStorage.getItem("cl_utm_logged") === code) return;
        sessionStorage.setItem("cl_utm_logged", code);
      } catch {}
      logClick(code);
    }
  }, [searchParams]);

  return null;
}
