"use client";

import { Fragment } from "react";
import { QuestionSticker } from "@/components/ui/stickers";
import type { CachedMessage } from "@/lib/chat-cache";
import { ChatAvatar } from "./chat-avatar";
import { formatDayLabel, isSameDay } from "./chat-format";
import { type BubblePosition, ChatMessageRow } from "./chat-message-row";

const STARTERS = ["Hi!", "Which year are you in?", "Got the notes for today?"];

/** First-message prompt: a question sticker with tap-to-send starters. The thread's one sticker moment. */
export function ChatThreadEmpty({ name, onSend }: { name: string; onSend: (text: string) => void }) {
  const first = name.split(" ")[0] || name;
  return (
    <div className="flex min-h-full items-center justify-center py-10">
      <QuestionSticker prompt={`Say hi to ${first}`} className="sticker-pop w-full max-w-xs">
        <div className="flex flex-col gap-2 p-4">
          <p className="text-sm text-fg-muted">Tap one to send it, or type your own below.</p>
          {STARTERS.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => onSend(text)}
              className="min-h-11 cursor-pointer rounded-full bg-surface-muted px-4 text-left text-sm font-medium text-fg transition-ui outline-none hover:bg-brand-subtle hover:text-brand-text focus-visible:ring-2 focus-visible:ring-ring"
            >
              {text}
            </button>
          ))}
        </div>
      </QuestionSticker>
    </div>
  );
}

interface ChatMessageListProps {
  messages: CachedMessage[];
  currentUserId: string;
  isGroupChat: boolean;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: CachedMessage) => void;
  onOptions: (msg: CachedMessage) => void;
}

/** Messages with day dividers and grouped bubbles (consecutive messages from one sender). */
export function ChatMessageList({
  messages,
  currentUserId,
  isGroupChat,
  onReact,
  onReply,
  onOptions,
}: ChatMessageListProps) {
  return (
    <ol className="space-y-0.5" aria-label="Messages">
      {messages.map((msg, idx) => {
        const prev = messages[idx - 1];
        const next = messages[idx + 1];
        const newDay = !prev || !isSameDay(prev.createdAt, msg.createdAt);
        const first = newDay || prev.senderId !== msg.senderId;
        const last = !next || next.senderId !== msg.senderId || !isSameDay(next.createdAt, msg.createdAt);
        const position: BubblePosition =
          first && last ? "single" : first ? "first" : last ? "last" : "middle";
        const isMe = msg.senderId === currentUserId;
        const showSender = isGroupChat && !isMe && first;

        return (
          <Fragment key={msg.id}>
            {newDay && (
              <li className="flex justify-center py-3">
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-fg-muted">
                  {formatDayLabel(msg.createdAt)}
                </span>
              </li>
            )}
            <li className={first && !newDay ? "pt-2.5" : undefined}>
              <ChatMessageRow
                msg={msg}
                isMe={isMe}
                position={position}
                currentUserId={currentUserId}
                showAvatarSlot={isGroupChat && !isMe}
                sender={
                  showSender
                    ? {
                        name: msg.sender?.displayName || "Member",
                        username: msg.sender?.username,
                        avatar: (
                          <ChatAvatar
                            name={msg.sender?.displayName}
                            src={msg.sender?.avatarUrl}
                            className="size-7"
                          />
                        ),
                      }
                    : null
                }
                onReact={onReact}
                onReply={onReply}
                onOptions={onOptions}
              />
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
