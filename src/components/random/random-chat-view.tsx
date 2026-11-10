"use client";

import {
  ArrowLeft,
  Lightbulb,
  MessageCircle,
  MoreVertical,
  Send,
  ShieldCheck,
  SkipForward,
  UserCheck,
  Video,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { QuestionSticker } from "@/components/ui/stickers";
import { cn, formatTimeAgo, initialOf } from "@/lib/utils";

interface RandomChatViewProps {
  session: any;
  partner: any;
  messages: any[];
  starter: string;
  onShuffleStarter: () => void;
  inputText: string;
  onInputChange: (text: string) => void;
  onSend: (e?: React.FormEvent) => void;
  isSending: boolean;
  onLeave: () => void;
  onNext: () => void;
  onVideo: () => void;
  onReveal: () => void;
  onKeepTalking: () => void;
  onShowSafety: () => void;
  onShowOptions: () => void;
}

const iconButton =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function RandomChatView(props: RandomChatViewProps) {
  const { session, partner, messages } = props;
  const endRef = useRef<HTMLDivElement | null>(null);
  const partnerName = partner?.displayName || "Anonymous student";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-50 mx-auto flex h-dvh max-w-2xl flex-col border-border bg-bg sm:border-x">
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-bg px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={props.onLeave} className={iconButton} aria-label="Leave chat">
          <ArrowLeft className="size-5" aria-hidden />
        </button>

        <Avatar className="size-9">
          {partner?.avatarUrl ? <AvatarImage src={partner.avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-surface-muted text-sm font-semibold text-fg-muted">
            {initialOf(partnerName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-fg">{partnerName}</p>
          <p className="truncate text-xs text-fg-muted">
            {partner?.collegeName?.split(",")[0] || "Student"}
            {partner?.year ? ` · Year ${partner.year}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={props.onShowSafety}
          className={iconButton}
          aria-label="How we keep it safe"
        >
          <ShieldCheck className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={props.onShowOptions}
          className={iconButton}
          aria-label="Report or block"
        >
          <MoreVertical className="size-5" aria-hidden />
        </button>
      </header>

      {/* Once the chat is going, the idea shrinks to a strip; before that it is the question sticker below. */}
      {messages.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface-muted px-4 py-1">
          <Lightbulb className="size-4 shrink-0 text-fg-muted" aria-hidden />
          <p className="min-w-0 flex-1 truncate text-sm text-fg">{props.starter}</p>
          <Button variant="ghost" size="sm" onClick={props.onShuffleStarter}>
            New idea
          </Button>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-5 py-6">
            <div className="space-y-1 text-center">
              <p className="font-display text-lg font-bold text-fg">You're connected</p>
              <p className="text-sm text-fg-muted">Say hi, or answer this one below. Be kind.</p>
            </div>
            <QuestionSticker prompt={props.starter} variant="flat" className="w-full max-w-sm">
              <Button variant="ghost" size="sm" onClick={props.onShuffleStarter} className="-ml-3">
                <Lightbulb aria-hidden />
                New idea
              </Button>
            </QuestionSticker>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex max-w-[82%] flex-col", m.isMine ? "ml-auto items-end" : "items-start")}
            >
              <p
                className={cn(
                  "break-words rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                  m.isMine ? "rounded-br-sm bg-brand text-brand-fg" : "rounded-bl-sm bg-surface-muted text-fg"
                )}
              >
                {m.body}
              </p>
              <span className="px-1 pt-0.5 text-xs text-fg-subtle">{formatTimeAgo(m.createdAt)}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 space-y-2 border-t border-border bg-bg p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 no-scrollbar">
          <Chip onClick={props.onNext} icon={<SkipForward className="size-4" />} className="shrink-0">
            Next person
          </Chip>
          {!session?.isBothVideoAccepted && (
            <Chip
              selected={Boolean(session?.myVideoRequested)}
              onClick={props.onVideo}
              icon={<Video className="size-4" />}
              className="shrink-0"
            >
              {session?.myVideoRequested ? "Video asked" : "Video"}
            </Chip>
          )}
          {!session?.isBothRevealed && (
            <Chip
              selected={Boolean(session?.myReveal)}
              onClick={props.onReveal}
              icon={<UserCheck className="size-4" />}
              className="shrink-0"
            >
              {session?.myReveal ? "Waiting for them" : "Show my name"}
            </Chip>
          )}
          <Chip
            selected={Boolean(session?.myContinue)}
            onClick={props.onKeepTalking}
            icon={<MessageCircle className="size-4" />}
            className="shrink-0"
          >
            {session?.myContinue ? "Waiting for them" : "Keep talking in Chat"}
          </Chip>
        </div>

        <form onSubmit={props.onSend} className="flex items-center gap-2">
          <label htmlFor="random-message" className="sr-only">
            Message
          </label>
          <Input
            id="random-message"
            type="text"
            value={props.inputText}
            maxLength={1000}
            autoComplete="off"
            onChange={(e) => props.onInputChange(e.target.value)}
            placeholder="Message"
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send"
            loading={props.isSending}
            disabled={!props.inputText.trim()}
          >
            {!props.isSending && <Send aria-hidden />}
          </Button>
        </form>
      </div>
    </div>
  );
}
