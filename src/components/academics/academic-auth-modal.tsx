"use client";

import { Bookmark, Bot, Download, MessageSquare, ThumbsUp, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GUEST_DOWNLOAD_LIMIT } from "@/lib/academic-download-limiter";
import { trackAuthModalCta, trackAuthModalTrigger } from "@/lib/analytics/ga4";
import { sounds } from "@/lib/sounds";

interface AcademicAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionReason?: "SAVE" | "VOTE" | "COMMENT" | "UPLOAD" | "AI" | "DOWNLOAD_LIMIT";
  returnTo?: string;
}

const REASONS = {
  SAVE: {
    icon: Bookmark,
    title: "Sign in to save this",
    body: "Saved notes and PYQs stay in one place for exam week.",
  },
  VOTE: {
    icon: ThumbsUp,
    title: "Sign in to vote",
    body: "Votes help others in your branch find the good notes.",
  },
  COMMENT: {
    icon: MessageSquare,
    title: "Sign in to comment",
    body: "Ask a doubt or point out a mistake in these notes.",
  },
  UPLOAD: {
    icon: Upload,
    title: "Sign in to upload",
    body: "Share your notes or PYQs and get 20 Loop Points for each upload.",
  },
  AI: {
    icon: Bot,
    title: "Sign in to use the study helper",
    body: "Open these notes in ChatGPT or Claude with a ready prompt.",
  },
  DOWNLOAD_LIMIT: {
    icon: Download,
    title: "You've used your free downloads",
    body: `Guests get ${GUEST_DOWNLOAD_LIMIT} downloads. Sign in with your college email to download as much as you want.`,
  },
} as const;

export function AcademicAuthModal({
  isOpen,
  onClose,
  actionReason = "SAVE",
  returnTo,
}: AcademicAuthModalProps) {
  const reason = REASONS[actionReason];
  const Icon = reason.icon;
  const signInUrl = `/sign-in${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;

  useEffect(() => {
    if (isOpen) trackAuthModalTrigger(actionReason, returnTo);
  }, [isOpen, actionReason, returnTo]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <span className="mb-2 flex size-12 items-center justify-center rounded-sticker bg-brand-subtle text-brand-text">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <DialogTitle>{reason.title}</DialogTitle>
          <DialogDescription>{reason.body}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link
              href={signInUrl}
              onClick={() => {
                sounds.tap();
                trackAuthModalCta(actionReason, "sign_in");
                onClose();
              }}
            >
              Sign in with college email
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              trackAuthModalCta(actionReason, "dismiss");
              onClose();
            }}
          >
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
