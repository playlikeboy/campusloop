"use client";

import {
  Archive,
  ArchiveRestore,
  Bell,
  BellOff,
  CheckCheck,
  Eraser,
  Mail,
  Pin,
  PinOff,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { CachedConversation } from "@/lib/chat-cache";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./chat-avatar";
import { isGroupConversation } from "./chat-format";

const ROW =
  "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-base font-medium text-fg transition-ui outline-none hover:bg-surface-muted focus-visible:bg-surface-muted disabled:cursor-wait disabled:opacity-60";

interface ConversationActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: CachedConversation | null;
  currentUserId: string;
  onActionComplete: () => void;
  onDeleteConversation?: (convId: string) => void;
}

/** Chat actions from the inbox (long-press, right-click or the dots): pin, mute, archive, read, clear, delete. */
export function ConversationActionModal({
  isOpen,
  onClose,
  conversation,
  onActionComplete,
  onDeleteConversation,
}: ConversationActionModalProps) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) setConfirmDelete(false);
  }, [isOpen]);

  if (!conversation) return null;

  const other = conversation.otherParticipant;
  const isGroup = isGroupConversation(conversation);
  const isPinned = Boolean(conversation.isPinned);
  const isMuted = Boolean(conversation.isMuted);
  const isArchived = Boolean(conversation.isArchived);
  const hasUnread = (conversation.unreadCount || 0) > 0;

  async function run(action: string, done: string) {
    if (!conversation) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/chat/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("update failed");
      toast.success(done);
      onActionComplete();
      onClose();
    } catch {
      toast.error("That didn't work. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!conversation) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/chat/${conversation.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      toast.success(isGroup ? "You left the group" : "Chat deleted");
      onDeleteConversation?.(conversation.id);
      onActionComplete();
      onClose();
    } catch {
      toast.error("Couldn't delete the chat. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="flex-row items-center gap-3 space-y-0">
          <ChatAvatar name={other?.displayName} src={other?.avatarUrl} className="size-11" />
          <div className="min-w-0">
            <DialogTitle className="flex items-center gap-1 truncate text-lg">
              <span className="truncate">{other?.displayName}</span>
              {!isGroup && other?.isCollegeVerified && <VerifiedBadge size="sm" />}
            </DialogTitle>
            {!isGroup && other?.username && (
              <DialogDescription className="truncate">@{other.username}</DialogDescription>
            )}
          </div>
        </DialogHeader>

        {confirmDelete ? (
          <div className="space-y-4">
            <p className="text-base text-fg">
              {isGroup
                ? `Leave ${other?.displayName}? You'll stop getting its messages.`
                : `Delete your chat with ${other?.displayName}? It goes from your inbox. They keep their copy.`}
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="danger" loading={busy} onClick={remove}>
                {isGroup ? "Leave group" : "Delete chat"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            <button
              type="button"
              className={ROW}
              disabled={busy}
              onClick={() => run(isPinned ? "unpin" : "pin", isPinned ? "Unpinned" : "Pinned to the top")}
            >
              {isPinned ? (
                <PinOff className="size-5 text-fg-muted" />
              ) : (
                <Pin className="size-5 text-fg-muted" />
              )}
              {isPinned ? "Unpin" : "Pin to top"}
            </button>
            <button
              type="button"
              className={ROW}
              disabled={busy}
              onClick={() => run(isMuted ? "unmute" : "mute", isMuted ? "Notifications on" : "Muted")}
            >
              {isMuted ? (
                <Bell className="size-5 text-fg-muted" />
              ) : (
                <BellOff className="size-5 text-fg-muted" />
              )}
              {isMuted ? "Unmute" : "Mute notifications"}
            </button>
            <button
              type="button"
              className={ROW}
              disabled={busy}
              onClick={() =>
                run(isArchived ? "unarchive" : "archive", isArchived ? "Moved back to chats" : "Archived")
              }
            >
              {isArchived ? (
                <ArchiveRestore className="size-5 text-fg-muted" />
              ) : (
                <Archive className="size-5 text-fg-muted" />
              )}
              {isArchived ? "Unarchive" : "Archive"}
            </button>
            <button
              type="button"
              className={ROW}
              disabled={busy}
              onClick={() =>
                run(
                  hasUnread ? "mark_read" : "mark_unread",
                  hasUnread ? "Marked as read" : "Marked as unread"
                )
              }
            >
              {hasUnread ? (
                <CheckCheck className="size-5 text-fg-muted" />
              ) : (
                <Mail className="size-5 text-fg-muted" />
              )}
              {hasUnread ? "Mark as read" : "Mark as unread"}
            </button>
            {!isGroup && other?.username && (
              <Link href={`/@${other.username}`} onClick={onClose} className={ROW}>
                <User className="size-5 text-fg-muted" />
                View profile
              </Link>
            )}
            <button
              type="button"
              className={ROW}
              disabled={busy}
              onClick={() => run("clear", "Messages cleared")}
            >
              <Eraser className="size-5 text-fg-muted" />
              Clear messages
            </button>
            <button
              type="button"
              className={cn(ROW, "text-danger hover:bg-danger-subtle")}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-5" />
              {isGroup ? "Leave group" : "Delete chat"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
