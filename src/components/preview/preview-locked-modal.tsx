"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { UserCapability } from "@/lib/capabilities";

interface PreviewLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpgrade?: () => void;
  capability?: UserCapability;
}

const FEATURE_COPY: Partial<Record<UserCapability, { title: string; desc: string }>> = {
  LIKE_POST: { title: "Verify to upvote", desc: "Add your college email to upvote posts." },
  COMMENT_POST: { title: "Verify to comment", desc: "Add your college email to reply to posts." },
  CREATE_POST: { title: "Verify to post", desc: "Add your college email to post on your campus feed." },
  SEND_MESSAGE: {
    title: "Verify to send messages",
    desc: "Add your college email to chat with other students.",
  },
  CAMPUS_MATCH: {
    title: "Verify to use Campus Match",
    desc: "Campus Match is only for students with a verified college email.",
  },
  SECRET_CRUSH: {
    title: "Verify to send a Secret Crush",
    desc: "Secret Crush is only for students with a verified college email.",
  },
  JOIN_COMMUNITY: {
    title: "Verify to join communities",
    desc: "Add your college email to join clubs and groups.",
  },
};

export function PreviewLockedModal({
  isOpen,
  onClose,
  onOpenUpgrade,
  capability = "LIKE_POST",
}: PreviewLockedModalProps) {
  const content = FEATURE_COPY[capability] || {
    title: "Verify your college email",
    desc: "Add your college email to do this.",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <div className="mb-4 flex size-12 items-center justify-center rounded-sticker bg-surface-muted text-fg">
          <Lock className="size-5" aria-hidden="true" />
        </div>
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.desc} Your saved posts stay as they are.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              onClose();
              onOpenUpgrade?.();
            }}
          >
            Add college email
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
