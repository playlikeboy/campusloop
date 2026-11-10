"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sounds } from "@/lib/sounds";

interface IncomingCallModalProps {
  incomingCall: {
    callId: string;
    caller: {
      id: string;
      displayName: string;
      avatarUrl?: string | null;
      username?: string;
    };
    type: "audio" | "video";
  };
  onAccept: () => void;
  onDecline: () => void;
}

/** Ringing screen for an incoming call. Uses the night palette, like the call itself. */
export function IncomingCallModal({ incomingCall, onAccept, onDecline }: IncomingCallModalProps) {
  const { caller, type } = incomingCall;
  const kind = type === "video" ? "video call" : "voice call";

  return (
    <div className="dark fixed inset-0 z-(--z-modal) flex items-end justify-center bg-overlay p-3 select-none sm:items-center sm:p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="incoming-call-title"
        aria-describedby="incoming-call-desc"
        className="sticker-pop w-full max-w-sm space-y-8 rounded-xl bg-surface-raised p-6 text-center text-fg shadow-lg"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2 border-brand motion-safe:animate-ping"
            />
            <Avatar className="size-24">
              <AvatarImage src={caller.avatarUrl || ""} alt="" />
              <AvatarFallback className="bg-brand-subtle text-2xl font-bold text-brand-text">
                {caller.displayName?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-1">
            <h2 id="incoming-call-title" className="font-display text-2xl font-bold text-fg">
              {caller.displayName}
            </h2>
            <p id="incoming-call-desc" className="text-sm text-fg-muted">
              Incoming {kind}
            </p>
          </div>
        </div>

        <div className="flex items-start justify-center gap-12">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => {
                sounds.pop();
                onDecline();
              }}
              aria-label={`Decline ${kind}`}
              className="flex size-16 cursor-pointer items-center justify-center rounded-full bg-danger text-danger-fg transition-ui outline-none hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised active:scale-95"
            >
              <PhoneOff className="size-7" />
            </button>
            <span className="text-sm font-medium text-fg-muted">Decline</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.ting();
                onAccept();
              }}
              aria-label={`Answer ${kind}`}
              className="flex size-16 cursor-pointer items-center justify-center rounded-full bg-brand text-brand-fg transition-ui outline-none hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised active:scale-95"
            >
              {type === "video" ? <Video className="size-7" /> : <Phone className="size-7" />}
            </button>
            <span className="text-sm font-medium text-fg-muted">Answer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
