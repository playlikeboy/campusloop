"use client";

import { Copy, CornerUpLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CachedMessage } from "@/lib/chat-cache";
import { messageKind } from "./chat-format";
import { ChatReactionBar } from "./chat-reactions";

const ROW =
  "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-base font-medium transition-ui outline-none hover:bg-surface-muted focus-visible:bg-surface-muted";

interface OptionsProps {
  msg: CachedMessage | null;
  onClose: () => void;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: CachedMessage) => void;
  onCopy: (msg: CachedMessage) => void;
  onDelete: (msg: CachedMessage) => void;
}

/** Long-press / "more" sheet for one message: react, reply, copy, delete. */
export function ChatMessageOptionsDialog({ msg, onClose, onReact, onReply, onCopy, onDelete }: OptionsProps) {
  const deleted = msg ? messageKind(msg.body) === "deleted" : false;
  return (
    <Dialog open={msg !== null} onOpenChange={(open) => !open && onClose()}>
      {msg && (
        <DialogContent className="max-w-sm space-y-3">
          <DialogHeader className="mb-0">
            <DialogTitle>Message</DialogTitle>
          </DialogHeader>
          {!deleted && (
            <ChatReactionBar
              size="md"
              className="shadow-none"
              onPick={(emoji) => {
                onReact(msg.id, emoji);
                onClose();
              }}
            />
          )}
          <div className="space-y-0.5">
            {!deleted && (
              <>
                <button
                  type="button"
                  className={ROW}
                  onClick={() => {
                    onReply(msg);
                    onClose();
                  }}
                >
                  <CornerUpLeft className="size-5 text-fg-muted" /> Reply
                </button>
                <button type="button" className={ROW} onClick={() => onCopy(msg)}>
                  <Copy className="size-5 text-fg-muted" /> Copy text
                </button>
              </>
            )}
            <button
              type="button"
              className={`${ROW} text-danger hover:bg-danger-subtle`}
              onClick={() => onDelete(msg)}
            >
              <Trash2 className="size-5" /> Delete
            </button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

/** Confirm delete: "for everyone" only on your own messages. */
export function ChatDeleteMessageDialog({
  msg,
  currentUserId,
  onClose,
  onConfirm,
}: {
  msg: CachedMessage | null;
  currentUserId: string;
  onClose: () => void;
  onConfirm: (msgId: string, scope: "everyone" | "me") => void;
}) {
  const mine = msg?.senderId === currentUserId && messageKind(msg.body) !== "deleted";
  return (
    <Dialog open={msg !== null} onOpenChange={(open) => !open && onClose()}>
      {msg && (
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this message?</DialogTitle>
            <DialogDescription>
              {mine
                ? "Delete it for everyone, or just remove it from your chat."
                : "It will be removed from your chat only."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {mine && (
              <Button variant="danger" onClick={() => onConfirm(msg.id, "everyone")}>
                Delete for everyone
              </Button>
            )}
            <Button variant={mine ? "secondary" : "danger"} onClick={() => onConfirm(msg.id, "me")}>
              Delete for me
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
