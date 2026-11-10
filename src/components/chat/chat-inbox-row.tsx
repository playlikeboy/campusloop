"use client";

import { BellOff, CheckCheck, MoreVertical, Pin } from "lucide-react";
import { useRef } from "react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { CachedConversation } from "@/lib/chat-cache";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./chat-avatar";
import { formatInboxTime, isGroupConversation, previewText } from "./chat-format";

interface ChatInboxRowProps {
  conversation: CachedConversation;
  currentUserId: string;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpenActions: (conv: CachedConversation) => void;
}

/** One inbox row. Tap opens the chat; long-press, right-click or the dots open chat actions. */
export function ChatInboxRow({
  conversation: conv,
  currentUserId,
  selected,
  onSelect,
  onOpenActions,
}: ChatInboxRowProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);
  const other = conv.otherParticipant;
  const unread = conv.unreadCount || 0;
  const isGroup = isGroupConversation(conv);
  const lastIsMine = conv.lastMessage?.senderId === currentUserId;

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  return (
    <div
      className={cn(
        "group relative flex items-center rounded-lg transition-ui",
        selected ? "bg-brand-subtle" : "hover:bg-surface-muted"
      )}
    >
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onTouchStart={() => {
          longPressedRef.current = false;
          timerRef.current = setTimeout(() => {
            longPressedRef.current = true;
            navigator.vibrate?.(40);
            onOpenActions(conv);
          }, 450);
        }}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onContextMenu={(e) => {
          e.preventDefault();
          onOpenActions(conv);
        }}
        onClick={() => {
          if (longPressedRef.current) {
            longPressedRef.current = false;
            return;
          }
          onSelect(conv.id);
        }}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChatAvatar
          name={other.displayName}
          src={other.avatarUrl}
          lastSeenAt={other.lastSeenAt}
          showPresence={!isGroup}
        />

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1">
              <span className={cn("truncate text-base text-fg", unread > 0 ? "font-bold" : "font-semibold")}>
                {other.displayName}
              </span>
              {!isGroup && other.isCollegeVerified && <VerifiedBadge size="sm" />}
              {conv.isPinned && <Pin aria-label="Pinned" className="size-3.5 shrink-0 text-fg-subtle" />}
              {conv.isMuted && <BellOff aria-label="Muted" className="size-3.5 shrink-0 text-fg-subtle" />}
            </span>
            {conv.lastMessage && (
              <span
                className={cn(
                  "shrink-0 text-xs tabular-nums",
                  unread > 0 ? "font-semibold text-brand-text" : "text-fg-subtle"
                )}
              >
                {formatInboxTime(conv.lastMessage.createdAt)}
              </span>
            )}
          </span>

          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1">
              {lastIsMine && conv.lastMessage && (
                <CheckCheck
                  aria-label={conv.lastMessage.readAt ? "Seen" : "Sent"}
                  className={cn(
                    "size-4 shrink-0",
                    conv.lastMessage.readAt ? "text-brand-text" : "text-fg-subtle"
                  )}
                />
              )}
              <span className={cn("truncate text-sm", unread > 0 ? "font-medium text-fg" : "text-fg-muted")}>
                {previewText(conv.lastMessage?.body)}
              </span>
            </span>
            {unread > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-brand-fg tabular-nums">
                {unread > 99 ? "99+" : unread}
                <span className="sr-only"> unread</span>
              </span>
            )}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => onOpenActions(conv)}
        aria-label={`Options for chat with ${other.displayName}`}
        className="mr-1 hidden size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-muted opacity-0 transition-ui outline-none group-hover:opacity-100 hover:bg-surface-sunken hover:text-fg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring md:flex"
      >
        <MoreVertical className="size-4" />
      </button>
    </div>
  );
}
