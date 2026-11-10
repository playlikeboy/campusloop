"use client";

import { Ban, CheckCheck, Clock, Heart } from "lucide-react";
import { AudioPlayer } from "@/components/media/audio-player";
import { DocumentCard } from "@/components/media/document-card";
import { VideoPlayer } from "@/components/media/video-player";
import type { CachedMessage } from "@/lib/chat-cache";
import { cn } from "@/lib/utils";
import {
  deletedLabel,
  documentMeta,
  formatMessageTime,
  type MessageKind,
  mediaUrl,
  splitQuote,
} from "./chat-format";
import { ChatMessageContent } from "./chat-message-content";

/** Time plus sent / seen ticks for your own messages. */
export function MessageMeta({
  msg,
  isMe,
  onMedia = false,
}: {
  msg: CachedMessage;
  isMe: boolean;
  onMedia?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs leading-none tabular-nums select-none",
        onMedia
          ? "rounded-full bg-overlay px-2 py-1 text-story-field-fg"
          : isMe
            ? "text-brand-fg/80"
            : "text-fg-subtle"
      )}
    >
      {formatMessageTime(msg.createdAt)}
      {isMe &&
        (msg.optimistic ? (
          <Clock aria-label="Sending" className="size-3" />
        ) : (
          <CheckCheck
            aria-label={msg.readAt ? "Seen" : "Sent"}
            className={cn("size-3.5", msg.readAt ? "opacity-100" : "opacity-60")}
          />
        ))}
    </span>
  );
}

/** Centered card for a Secret Crush match greeting. */
export function CrushMatchCard({ msg }: { msg: CachedMessage }) {
  return (
    <div className="mx-auto my-4 w-full max-w-sm space-y-2 rounded-lg border border-crush-subtle bg-crush-subtle p-5 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-crush text-crush-fg">
        <Heart className="size-5 fill-current" aria-hidden="true" />
      </div>
      <p className="font-display text-lg font-bold text-crush-text">It&apos;s a match</p>
      <p className="text-sm text-fg">You both liked each other. Now you can see who it is. Say hi.</p>
      <p className="text-xs text-fg-muted tabular-nums">{formatMessageTime(msg.createdAt)}</p>
    </div>
  );
}

/** What goes inside a bubble, by message kind. */
export function MessageBody({ msg, kind, isMe }: { msg: CachedMessage; kind: MessageKind; isMe: boolean }) {
  if (kind === "deleted") {
    return (
      <div className="flex items-end gap-3">
        <span className="inline-flex items-center gap-1.5 italic opacity-80">
          <Ban className="size-3.5 shrink-0" aria-hidden="true" />
          {deletedLabel(msg.body)}
        </span>
        <MessageMeta msg={msg} isMe={isMe} />
      </div>
    );
  }

  if (kind === "image") {
    return (
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={mediaUrl(msg.body)}
          alt={isMe ? "Photo you sent" : "Photo"}
          className="max-h-72 max-w-full rounded-lg object-cover"
          loading="lazy"
        />
        <span className="absolute right-2 bottom-2">
          <MessageMeta msg={msg} isMe={isMe} onMedia />
        </span>
      </div>
    );
  }

  const url = mediaUrl(msg.body);
  const meta = (
    <div className="mt-1 flex justify-end">
      <MessageMeta msg={msg} isMe={isMe} />
    </div>
  );

  if (kind === "video") {
    return (
      <>
        <div className="w-full max-w-xs overflow-hidden rounded-md sm:max-w-sm">
          <VideoPlayer src={url} compact />
        </div>
        {meta}
      </>
    );
  }
  if (kind === "voice") {
    return (
      <>
        <AudioPlayer src={url} compact isMe={isMe} />
        {meta}
      </>
    );
  }
  if (kind === "document") {
    const doc = documentMeta(msg.body);
    return (
      <>
        <DocumentCard url={url} name={doc.name} size={doc.size} compact isMe={isMe} />
        {meta}
      </>
    );
  }

  const { quote, text } = splitQuote(msg.body);
  return (
    <>
      {quote && (
        <p
          className={cn(
            "mb-1.5 truncate rounded-sm px-2.5 py-1.5 text-xs",
            isMe ? "bg-brand-fg/15 text-brand-fg" : "bg-surface text-fg-muted"
          )}
        >
          {quote}
        </p>
      )}
      <ChatMessageContent content={text} isMe={isMe} />
      {meta}
    </>
  );
}
