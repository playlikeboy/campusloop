"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/stickers";
import { hexclaveClientApp } from "@/hexclave/client";
import { trackSignupWallCta } from "@/lib/analytics/ga4";

function GoogleMark() {
  // Google's four-colour "G" is a brand mark and keeps its own colours.
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      {/* ds-allow: Google brand mark colours */}
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      {/* ds-allow: Google brand mark colours */}
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2a7 7 0 0 1-6.6-4.8h-4v3.1A12 12 0 0 0 12 24Z" />
      {/* ds-allow: Google brand mark colours */}
      <path fill="#FBBC05" d="M5.4 14.5a7.2 7.2 0 0 1 0-4.6V6.8h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      {/* ds-allow: Google brand mark colours */}
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.8l4 3.1A7 7 0 0 1 12 4.8Z" />
    </svg>
  );
}

/**
 * The card a signed-out visitor sees after the preview posts. Google is the
 * default, one-tap way in; email is the other.
 */
export function SignupWallCard({
  placement,
  returnTo,
}: {
  placement: "feeds" | "confessions";
  returnTo: string;
}) {
  const [busy, setBusy] = useState(false);
  const what = placement === "confessions" ? "confession" : "post";

  async function google() {
    setBusy(true);
    trackSignupWallCta(placement, "google");
    try {
      await hexclaveClientApp.signInWithOAuth("google", { returnTo });
    } catch {
      setBusy(false);
      toast.error("Google sign-in didn't open. Try your email instead.");
    }
  }

  return (
    <Sticker pop className="mx-3 my-4 space-y-4 p-5 sm:mx-4">
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted">
        <Lock className="size-4" aria-hidden="true" />
        Free to join
      </p>
      <h2 className="sticker-caption text-3xl text-fg">See what your college is saying</h2>
      <p className="text-base text-fg-muted">
        Join free with any email to read every {what}, vote and post. Verified students get a badge. Your
        name never shows on a confession.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={google} loading={busy}>
          {!busy && <GoogleMark />}
          Continue with Google
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link
            href={`/join?returnTo=${encodeURIComponent(returnTo)}`}
            onClick={() => trackSignupWallCta(placement, "email")}
          >
            <Mail aria-hidden="true" />
            Use email
          </Link>
        </Button>
      </div>
    </Sticker>
  );
}
