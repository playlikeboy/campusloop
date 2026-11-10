"use client";

import { BadgeCheck } from "lucide-react";
import { useState } from "react";
import { CampusUnlockedModal } from "@/components/preview/campus-unlocked-modal";

/**
 * Nudge to verify a college email. Accounts without one can already post and
 * chat (see rejectViewerWrite); verifying adds the verified badge and Campus Match.
 */
export function PreviewModeBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="mx-3 my-2 flex min-h-11 flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-md bg-verified-subtle px-3 py-2 text-center text-sm text-fg sm:mx-0 sm:mt-0 sm:mb-4">
        <BadgeCheck className="size-4 shrink-0 text-verified-text" aria-hidden="true" />
        <span>Add your college email to get the verified badge and Campus Match.</span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer font-semibold text-brand-text underline underline-offset-4"
        >
          Verify now
        </button>
      </div>

      <CampusUnlockedModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
