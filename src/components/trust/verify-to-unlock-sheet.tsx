"use client";

import { ChevronRight, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CampusUnlockedModal } from "@/components/preview/campus-unlocked-modal";
import { GithubIcon } from "@/components/ui/social-icons";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type Capability, CAPABILITY_INFO } from "@/lib/trust";

interface VerifyToUnlockSheetProps {
  open: boolean;
  capability?: Capability;
  onClose: () => void;
}

/** "Verify to unlock": the two ways to prove student status, shown when a locked action is tapped. */
export function VerifyToUnlockSheet({ open, capability, onClose }: VerifyToUnlockSheetProps) {
  const [emailOpen, setEmailOpen] = useState(false);
  const title = capability ? CAPABILITY_INFO[capability].lockedTitle : "Verify to unlock";

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
        <SheetContent>
          <SheetHeader>
            <span className="mb-2 grid size-11 place-items-center rounded-sticker bg-verified-subtle text-verified-text">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              This is open to verified students. Verify once and you also get the verified badge next to your name.
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setEmailOpen(true);
              }}
              className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-lg border border-border p-3.5 text-left transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mail className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fg">Use my college email</span>
                <span className="block text-sm text-fg-muted">We email a link to your college inbox.</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            </button>
            <Link
              href="/settings/verify#github"
              onClick={onClose}
              className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-border p-3.5 transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <GithubIcon className="size-5 shrink-0 text-fg-muted" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fg">Use the GitHub Student Developer Pack</span>
                <span className="block text-sm text-fg-muted">No college email? Your GitHub student status works too.</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            </Link>
          </SheetBody>
        </SheetContent>
      </Sheet>
      <CampusUnlockedModal isOpen={emailOpen} onClose={() => setEmailOpen(false)} />
    </>
  );
}
