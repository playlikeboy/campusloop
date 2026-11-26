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
  LIKE_POST: { title: "Join to upvote", desc: "Join free with any email and pick your college to upvote posts." },
  COMMENT_POST: { title: "Join to comment", desc: "Join free with any email and pick your college to reply." },
  CREATE_POST: { title: "Join to post", desc: "Join free with any email and pick your college to post." },
  SEND_MESSAGE: {
    title: "Join to send messages",
    desc: "Join free with any email and pick your college to chat with other students.",
  },
  CAMPUS_MATCH: {
    title: "Verify to use Campus Match",
    desc: "Campus Match is only for verified students. Verify with your college email or GitHub Student Pack.",
  },
  SECRET_CRUSH: {
    title: "Verify to send a Secret Crush",
    desc: "Secret Crush is only for verified students. Verify with your college email or GitHub Student Pack.",
  },
  JOIN_COMMUNITY: {
    title: "Join to see communities",
    desc: "Join free with any email and pick your college to join clubs and groups.",
  },
};

export function PreviewLockedModal({
  isOpen,
  onClose,
  onOpenUpgrade,
  capability = "LIKE_POST",
}: PreviewLockedModalProps) {
  const content = FEATURE_COPY[capability] || {
    title: "Join CampusLoop",
    desc: "Join free with any email and pick your college to do this.",
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
            Sign in or join
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
