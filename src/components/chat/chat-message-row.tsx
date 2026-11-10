"use client";

import { CornerUpLeft, MoreHorizontal, SmilePlus } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import type { CachedMessage } from "@/lib/chat-cache";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { messageKind } from "./chat-format";
import { CrushMatchCard, MessageBody } from "./chat-message-body";
import { ChatReactionBar, ChatReactionSummary, QUICK_REACTIONS } from "./chat-reactions";

/** Double-tap a bubble to heart it, like Instagram DMs. */
const DOUBLE_TAP_REACTION = QUICK_REACTIONS[1];

export type BubblePosition = "single" | "first" | "middle" | "last";

const TAIL: Record<"me" | "them", Record<BubblePosition, string>> = {
  me: {
    single: "rounded-br-xs",
    first: "rounded-br-sm",
    middle: "rounded-r-sm",
    last: "rounded-tr-sm rounded-br-xs",
  },
  them: {
    single: "rounded-bl-xs",
    first: "rounded-bl-sm",
    middle: "rounded-l-sm",
    last: "rounded-tl-sm rounded-bl-xs",
  },
};

const ACTION_BTN =
  "flex size-10 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring";

interface ChatMessageRowProps {
  msg: CachedMessage;
  isMe: boolean;
  position: BubblePosition;
  currentUserId: string;
  /** Group chats show the sender's name and avatar on the first bubble of a run. */
  sender?: { name: string; username?: string | null; avatar?: React.ReactNode } | null;
  showAvatarSlot: boolean;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: CachedMessage) => void;
  onOptions: (msg: CachedMessage) => void;
}

/** One message: bubble, hover actions, reaction picker, swipe-to-reply and long-press on touch. */
export const ChatMessageRow = memo(function ChatMessageRow({
  msg,
  isMe,
  position,
  currentUserId,
  sender,
  showAvatarSlot,
  onReact,
  onReply,
  onOptions,
}: ChatMessageRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [swipe, setSwipe] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kind = messageKind(msg.body);
  const deleted = kind === "deleted";

  useEffect(() => {
    if (!pickerOpen) return;
    const close = () => setPickerOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  if (kind === "crush-match") return <CrushMatchCard msg={msg} />;

  const clearPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const isMedia = kind === "image";
  const reactions = msg.reactions || [];

  return (
    <div
      className={cn(
        "group/row relative flex touch-pan-y items-end gap-1.5",
        isMe ? "justify-end" : "justify-start",
        // Spring back after a swipe; follow the finger exactly while dragging.
        !dragging && "transition-transform duration-200 ease-out"
      )}
      style={swipe ? { transform: `translateX(${swipe}px)` } : undefined}
      onTouchStart={(e) => {
        start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        clearPress();
        pressTimer.current = setTimeout(() => {
          sounds.pop();
          haptics.medium();
          onOptions(msg);
        }, 450);
      }}
      onTouchMove={(e) => {
        if (!start.current) return;
        const dx = e.touches[0].clientX - start.current.x;
        const dy = e.touches[0].clientY - start.current.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) clearPress();
        if (!deleted && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          setDragging(true);
          setSwipe(Math.min(Math.max(dx, -80), 80));
        }
      }}
      onTouchCancel={() => {
        clearPress();
        setDragging(false);
        setSwipe(0);
        start.current = null;
      }}
      onTouchEnd={() => {
        clearPress();
        if (Math.abs(swipe) >= 45) {
          sounds.tap();
          haptics.light();
          onReply(msg);
        }
        setDragging(false);
        setSwipe(0);
        start.current = null;
      }}
      onDoubleClick={() => !deleted && onReact(msg.id, DOUBLE_TAP_REACTION)}
    >
      {swipe !== 0 && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface-muted text-fg-muted transition-ui",
            swipe > 0 ? "-left-10" : "-right-10",
            Math.abs(swipe) >= 45 && "bg-brand-subtle text-brand-text"
          )}
        >
          <CornerUpLeft className="size-4" />
        </span>
      )}

      {showAvatarSlot && <div className="w-7 shrink-0 self-end pb-0.5">{sender?.avatar}</div>}

      <div
        className={cn(
          "relative flex max-w-[82%] flex-col sm:max-w-[72%] md:max-w-[64%]",
          isMe ? "items-end" : "items-start"
        )}
      >
        {sender && <span className="mb-0.5 px-3 text-xs font-semibold text-brand-text">{sender.name}</span>}

        <div
          className={cn(
            "relative text-left text-base leading-snug",
            msg.optimistic && "chat-message-send",
            isMedia
              ? "p-0"
              : cn(
                  "rounded-lg px-3.5 py-2",
                  TAIL[isMe ? "me" : "them"][position],
                  isMe ? "bg-brand text-brand-fg" : "bg-surface-muted text-fg"
                ),
            reactions.length > 0 && "mb-3"
          )}
        >
          <MessageBody msg={msg} kind={kind} isMe={isMe} />
          {reactions.length > 0 && (
            <ChatReactionSummary
              reactions={reactions}
              currentUserId={currentUserId}
              align={isMe ? "right" : "left"}
              onToggle={(emoji) => onReact(msg.id, emoji)}
            />
          )}
        </div>

        {pickerOpen && (
          <ChatReactionBar
            className={cn("absolute -top-12 z-(--z-dropdown)", isMe ? "right-0" : "left-0")}
            onPick={(emoji) => {
              setPickerOpen(false);
              onReact(msg.id, emoji);
            }}
          />
        )}
      </div>

      {!deleted && (
        <div
          className={cn(
            "mb-1 hidden shrink-0 items-center opacity-0 transition-ui group-hover/row:opacity-100 focus-within:opacity-100 md:flex",
            pickerOpen && "opacity-100",
            isMe ? "order-first" : "order-last"
          )}
        >
          <button
            type="button"
            aria-label="React"
            aria-expanded={pickerOpen}
            className={ACTION_BTN}
            onClick={(e) => {
              e.stopPropagation();
              setPickerOpen((v) => !v);
            }}
          >
            <SmilePlus className="size-4" />
          </button>
          <button type="button" aria-label="Reply" className={ACTION_BTN} onClick={() => onReply(msg)}>
            <CornerUpLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="More message options"
            className={ACTION_BTN}
            onClick={() => onOptions(msg)}
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
});
