"use client";

import { Check } from "lucide-react";
import type * as React from "react";
import { useId } from "react";

import { cn } from "@/lib/utils";

export interface PollStickerOption {
  id: string;
  label: React.ReactNode;
  votes: number;
  /** The viewer picked this one. */
  chosen?: boolean;
}

export interface PollStickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: PollStickerOption[];
  /** Optional question shown as the sticker caption. */
  question?: React.ReactNode;
  /** Show results (bars fill). Usually true once the viewer has voted. */
  showResults?: boolean;
  onVote?: (optionId: string) => void;
  disabled?: boolean;
  /** `sticker` = lifted tile (marketing, one per screen). `flat` = calm, inside feed posts. */
  variant?: "sticker" | "flat";
  /** Text under the bars, e.g. "128 votes". Defaults to the vote count. */
  footer?: React.ReactNode;
}

/** Story poll: tap an option, bars fill to the result. Keyboard: Tab to an option, Enter/Space votes. */
export function PollSticker({
  options,
  question,
  showResults = false,
  onVote,
  disabled,
  variant = "sticker",
  footer,
  className,
  ...props
}: PollStickerProps) {
  const id = useId();
  const total = options.reduce((n, o) => n + o.votes, 0);
  const pct = (votes: number) => (total > 0 ? Math.round((votes / total) * 100) : 0);

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would need a legend; the question is optional
    <div
      data-slot="poll-sticker"
      role="group"
      aria-labelledby={question ? `${id}-q` : undefined}
      className={cn(
        "flex flex-col gap-2 rounded-sticker bg-sticker text-sticker-fg",
        variant === "sticker" ? "p-4 shadow-sticker" : "border border-sticker-border p-3",
        className
      )}
      {...props}
    >
      {question && (
        <p id={`${id}-q`} className="sticker-caption px-1 pb-1 text-xl text-balance">
          {question}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {options.map((o) => {
          const p = pct(o.votes);
          return (
            <li key={o.id}>
              {showResults ? (
                <div className="relative min-h-11 overflow-hidden rounded-sm bg-poll-track">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "poll-fill absolute inset-0",
                      o.chosen ? "bg-poll-fill-chosen" : "bg-poll-fill"
                    )}
                    style={{ ["--fill" as string]: p }}
                  />
                  <div className="relative flex min-h-11 items-center justify-between gap-3 px-3.5 py-2 text-sm">
                    <span
                      className={cn(
                        "flex min-w-0 items-center gap-1.5",
                        o.chosen ? "font-bold" : "font-medium"
                      )}
                    >
                      <span className="min-w-0">{o.label}</span>
                      {o.chosen && (
                        <Check aria-label="Your vote" className="size-4 shrink-0 text-brand-text" />
                      )}
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">{p}%</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={disabled || !onVote}
                  onClick={() => onVote?.(o.id)}
                  className={cn(
                    "flex min-h-11 w-full cursor-pointer items-center rounded-sm border border-border-strong bg-sticker px-3.5 py-2 text-left text-sm font-semibold",
                    "transition-ui outline-none hover:border-brand hover:bg-brand-subtle active:scale-[0.98]",
                    "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  {o.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="px-1 text-xs font-medium text-fg-muted" aria-live="polite">
        {footer ?? (showResults ? `${total} ${total === 1 ? "vote" : "votes"}` : "Tap to vote")}
      </p>
    </div>
  );
}
