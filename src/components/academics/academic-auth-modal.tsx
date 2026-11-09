"use client";

import {
  Bookmark,
  ChevronRight,
  Download,
  GraduationCap,
  MessageSquare,
  ThumbsUp,
  UploadCloud,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trackAuthModalCta, trackAuthModalTrigger } from "@/lib/analytics/ga4";
import { sounds } from "@/lib/sounds";

interface AcademicAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionReason?: "SAVE" | "VOTE" | "COMMENT" | "UPLOAD" | "AI" | "DOWNLOAD_LIMIT";
  returnTo?: string;
}

export function AcademicAuthModal({
  isOpen,
  onClose,
  actionReason = "SAVE",
  returnTo,
}: AcademicAuthModalProps) {
  const reasonText = {
    SAVE: {
      title: "Save to Your Personal Study Vault",
      subtitle: "Never lose a syllabus paper or formula sheet before exam night.",
      icon: Bookmark,
      color: "text-brand-text",
      bg: "bg-brand-subtle",
    },
    VOTE: {
      title: "Vote & Verify Syllabus Accuracy",
      subtitle: "Help your batchmates find the best notes and earn Loop Points.",
      icon: ThumbsUp,
      color: "text-brand-text",
      bg: "bg-brand-subtle",
    },
    COMMENT: {
      title: "Ask Doubts & Post Formula Corrections",
      subtitle: "Connect with branch toppers and verified seniors directly.",
      icon: MessageSquare,
      color: "text-brand-text",
      bg: "bg-brand-subtle",
    },
    UPLOAD: {
      title: "Share Notes & Earn 20 LP per Upload",
      subtitle: "Become the campus legend by contributing PYQs and lab manuals.",
      icon: UploadCloud,
      color: "text-reward-text",
      bg: "bg-reward-subtle",
    },
    AI: {
      title: "Unlock Campus AI Study Cram Assistant",
      subtitle: "Instant 15-minute exam summaries, key formulas, and chapter breakdowns.",
      icon: Zap,
      color: "text-brand-text",
      bg: "bg-brand-subtle",
    },
    DOWNLOAD_LIMIT: {
      title: "Unlock Unlimited Free Downloads",
      subtitle:
        "You've reached your 5 free guest downloads limit! Sign in or create a free account with your college email for unlimited downloads, verified solutions & offline sync.",
      icon: Download,
      color: "text-brand-text",
      bg: "bg-brand-subtle",
    },
  }[actionReason];

  const CurrentIcon = reasonText.icon;
  const signInUrl = `/sign-in${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;

  useEffect(() => {
    if (isOpen) {
      trackAuthModalTrigger(actionReason, returnTo);
    }
  }, [isOpen, actionReason, returnTo]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-surface rounded-xl shadow-lg">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-md bg-surface-muted text-fg">
                <CurrentIcon className="size-5 text-foreground" />
              </span>
              <div>
                <h2 className="text-sm font-black text-foreground">{reasonText.title}</h2>
              </div>
            </div>
          </div>

          {/* Body */}
          <p className="text-xs text-muted-foreground leading-relaxed">{reasonText.subtitle}</p>

          {/* Perks list */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-muted/20 border border-border/40 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="flex size-5 items-center justify-center rounded-md bg-muted text-foreground border border-border/40 shrink-0">
                <Zap className="size-3 text-reward" />
              </span>
              <span>Instant +50 Loop Points (LP) Welcome Bonus</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="flex size-5 items-center justify-center rounded-md bg-muted text-foreground border border-border/40 shrink-0">
                <Bookmark className="size-3" />
              </span>
              <span>Offline mobile sync across all 8 semesters</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="flex size-5 items-center justify-center rounded-md bg-muted text-foreground border border-border/40 shrink-0">
                <GraduationCap className="size-3" />
              </span>
              <span>Verified Student Badge &amp; College Hub Access</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            <Link
              href={signInUrl}
              onClick={() => {
                sounds.tap();
                trackAuthModalCta(actionReason, "sign_in");
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-brand text-brand-fg hover:bg-brand-hover font-bold text-xs transition-colors active:scale-95 cursor-pointer"
            >
              <span>Sign In with College Email</span>
              <ChevronRight className="size-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                trackAuthModalCta(actionReason, "dismiss");
                onClose();
              }}
              className="w-full py-2 text-center text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              Continue Browsing as Guest
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
