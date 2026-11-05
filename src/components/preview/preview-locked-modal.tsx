"use client";

import { ArrowRight, CheckCircle2, Lock, School, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserCapability } from "@/lib/capabilities";

interface PreviewLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpgrade?: () => void;
  capability?: UserCapability;
}

const FEATURE_TITLES: Partial<Record<UserCapability, { title: string; desc: string; iconBg: string }>> = {
  LIKE_POST: {
    title: "Upvotes Unlock in Student Mode",
    desc: "React, upvote, and boost campus discussions once you connect your official college email.",
    iconBg: "bg-danger-subtle text-danger border-danger",
  },
  COMMENT_POST: {
    title: "Comments Unlock in Student Mode",
    desc: "Join real-time banter and answer questions from verified students across Indian campuses.",
    iconBg: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  },
  CREATE_POST: {
    title: "Posting Unlocks in Student Mode",
    desc: "Share your thoughts, confessions, polls, and campus vibes with verified classmates.",
    iconBg: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  },
  SEND_MESSAGE: {
    title: "Direct Messages Unlock in Student Mode",
    desc: "Connect directly with verified students, batchmates, and friends in your campus network.",
    iconBg: "bg-success-subtle text-success border-success",
  },
  CAMPUS_MATCH: {
    title: "Campus Match Unlocks in Student Mode",
    desc: "Swipe deck and matching is reserved exclusively for verified college students in a safe, mutual opt-in space.",
    iconBg: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  },
  SECRET_CRUSH: {
    title: "Secret Crush Unlocks in Student Mode",
    desc: "Send anonymous crush signals safely to verified batchmates with 100% mutual reveal.",
    iconBg: "bg-crush-subtle text-crush-text border-crush",
  },
  JOIN_COMMUNITY: {
    title: "Communities Unlock in Student Mode",
    desc: "Join clubs, departments, and secret student hubs across accredited Indian universities.",
    iconBg: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  },
};

export function PreviewLockedModal({
  isOpen,
  onClose,
  onOpenUpgrade,
  capability = "LIKE_POST",
}: PreviewLockedModalProps) {
  if (!isOpen) return null;

  const content = FEATURE_TITLES[capability] || {
    title: "Feature Locked in Campus Preview",
    desc: "Connect your official college email to interact with verified classmates and students.",
    iconBg: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 text-center">
        {/* Close Button */}
        <button
          aria-label="Close"
          type="button"
          onClick={onClose}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 absolute top-4 right-4 size-8 min-h-11 min-w-11 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Lock Icon */}
        <div className="mx-auto size-14 rounded-3xl border border-border bg-surface-muted flex items-center justify-center mt-2">
          <Lock className="size-6 text-foreground" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-warning-subtle text-warning border border-warning">
            <School className="size-3" /> Campus Preview Mode
          </span>
          <h2 className="text-lg font-black tracking-tight text-foreground">{content.title}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">{content.desc}</p>
        </div>

        {/* Benefits List */}
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-3.5 text-left space-y-2 text-xs">
          <p className="text-xs font-bold text-foreground">
            With Verified Student Mode:
          </p>
          <div className="space-y-1.5 text-muted-foreground text-[11px]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-success shrink-0" />
              <span>Full posting, comment debates & upvoting</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-success shrink-0" />
              <span>Campus Match & Secret Crush Vault</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-success shrink-0" />
              <span>All your saved posts remain 100% preserved</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <Button
            onClick={() => {
              onClose();
              onOpenUpgrade?.();
            }}
            className="w-full h-11 text-xs font-black rounded-2xl bg-foreground text-background hover:opacity-90 transition-opacity gap-2 cursor-pointer shadow-md"
          >
            <span>Connect College Email &amp; Unlock</span>
            <ArrowRight className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full h-9 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Keep Exploring Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
