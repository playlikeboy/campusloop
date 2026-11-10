"use client";

import { Loader2, MessageCircleOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sticker } from "@/components/ui/stickers";

/** Waiting in the queue for a match. */
export function RandomSearchingView({ onCancel }: { onCancel: () => void }) {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col items-center justify-center gap-6 p-4 text-center">
      <Sticker pop className="flex size-24 items-center justify-center">
        <Loader2 className="size-10 animate-spin text-brand-text" aria-hidden />
      </Sticker>
      <div className="space-y-1" aria-live="polite">
        <h1 className="text-2xl">Finding someone…</h1>
        <p className="text-sm text-fg-muted">This can take a minute. Keep this screen open.</p>
      </div>
      <Button variant="secondary" onClick={onCancel}>
        Stop searching
      </Button>
    </main>
  );
}

export const CHAT_RATINGS = [
  { value: "FUN", label: "Fun" },
  { value: "INTERESTING", label: "Interesting" },
  { value: "HELPFUL", label: "Helpful" },
  { value: "OKAY", label: "Okay" },
  { value: "UNCOMFORTABLE", label: "Made me uncomfortable" },
];

interface RandomEndedViewProps {
  rating: string | null;
  onRate: (rating: string) => void;
  onFindNext: () => void;
  onDone: () => void;
}

/** The other person left or the chat closed. Rate it, then go again or stop. */
export function RandomEndedView({ rating, onRate, onFindNext, onDone }: RandomEndedViewProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col items-center justify-center gap-6 p-4 text-center">
      <MessageCircleOff className="size-10 text-fg-muted" aria-hidden />
      <div className="space-y-1">
        <h1 className="text-2xl">Chat ended</h1>
        <p className="text-sm text-fg-muted">How was it? Only our team sees this.</p>
      </div>
      <fieldset className="flex flex-wrap justify-center gap-2">
        <legend className="sr-only">Rate this chat</legend>
        {CHAT_RATINGS.map((r) => (
          <Chip
            key={r.value}
            selected={rating === r.value}
            onClick={() => {
              if (!rating) onRate(r.value);
            }}
            disabled={Boolean(rating) && rating !== r.value}
          >
            {r.label}
          </Chip>
        ))}
      </fieldset>
      {rating && <p className="text-sm text-fg-muted">Thanks for telling us.</p>}
      <div className="flex w-full flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onFindNext}>
          Find someone new
        </Button>
        <Button variant="ghost" className="w-full" onClick={onDone}>
          Done
        </Button>
      </div>
    </main>
  );
}
