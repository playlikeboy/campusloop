"use client";

import { useId } from "react";
import { AnimateSend } from "@/components/ui/animated-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteThoughts: string;
  setQuoteThoughts: (val: string) => void;
  isReposting: boolean;
  onExecuteRepost: (withCommentary: boolean) => void;
  originalPostAuthorHandle: string;
}

export function FeedCardRepostModal({
  isOpen,
  onClose,
  quoteThoughts,
  setQuoteThoughts,
  isReposting,
  onExecuteRepost,
  originalPostAuthorHandle,
}: RepostModalProps) {
  const fieldId = useId();

  return (
    // The card underneath opens the post on click; keep dialog clicks from reaching it.
    <div onClick={(e) => e.stopPropagation()}>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Repost</DialogTitle>
            <DialogDescription>Share it as is, or add a line of your own.</DialogDescription>
          </DialogHeader>

          <label htmlFor={fieldId} className="sr-only">
            Your comment
          </label>
          <Textarea
            id={fieldId}
            value={quoteThoughts}
            onChange={(e) => setQuoteThoughts(e.target.value)}
            placeholder={`What do you think of @${originalPostAuthorHandle}'s post?`}
            rows={3}
          />

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onExecuteRepost(false)}
              disabled={isReposting}
              className="flex-1"
            >
              Repost
            </Button>
            <Button
              type="button"
              onClick={() => onExecuteRepost(true)}
              loading={isReposting}
              disabled={isReposting || !quoteThoughts.trim()}
              className="flex-1"
            >
              <AnimateSend size={16} />
              Post with comment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
