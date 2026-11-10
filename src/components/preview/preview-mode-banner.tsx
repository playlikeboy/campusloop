"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { CampusUnlockedModal } from "@/components/preview/campus-unlocked-modal";
import { sounds } from "@/lib/sounds";

/**
 * Persistent nudge to verify a college email. The verification flow (CampusUnlockedModal)
 * already exists and already works — it just had no reachable trigger anywhere in the app
 * (the only `setShowUnlockModal` call site lived in navigation.tsx but was never wired to a
 * button). This component gives it one, and corrects the copy: accounts without a verified
 * college email already have near-full write access (see rejectViewerWrite) — verifying just
 * adds the college-verified checkmark and campus-only matchmaking, it doesn't "unlock" basics.
 */
export function PreviewModeBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="mx-3 sm:mx-0 my-2 sm:my-0 sm:mb-4 flex min-h-8 items-center justify-center gap-1.5 rounded-xl border border-warning bg-warning-subtle px-3 py-1.5 text-center text-xs font-medium text-warning backdrop-blur-sm flex-wrap">
        <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          You have full access as a guest student ·{" "}
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              setIsModalOpen(true);
            }}
            className="font-bold underline underline-offset-2 hover:text-warning transition-colors cursor-pointer"
          >
            Verify your college email
          </button>{" "}
          for a verified badge &amp; campus match.
        </span>
      </div>

      <CampusUnlockedModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
