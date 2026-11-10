"use client";

import type * as React from "react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface QuestionStickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit" | "onChange"> {
  /** The prompt in the violet header strip, e.g. "Ask me anything". */
  prompt: React.ReactNode;
  /** Composer mode: pass value + onChange + onSubmit to get a text box and send button. */
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  submitLabel?: string;
  maxLength?: number;
  loading?: boolean;
  disabled?: boolean;
  /** Display mode: body content (e.g. an answer) when not composing. */
  children?: React.ReactNode;
  variant?: "sticker" | "flat";
}

/** Question box: violet header strip + white body. Works as a composer (confessions, Q&A) or as an answer card. */
export function QuestionSticker({
  prompt,
  value,
  onChange,
  onSubmit,
  placeholder = "Type something…",
  submitLabel = "Send",
  maxLength,
  loading,
  disabled,
  children,
  variant = "sticker",
  className,
  ...props
}: QuestionStickerProps) {
  const id = useId();
  const composing = typeof onSubmit === "function";
  const text = value ?? "";

  return (
    <div
      data-slot="question-sticker"
      className={cn(
        "overflow-hidden rounded-sticker bg-sticker text-sticker-fg",
        variant === "sticker" ? "shadow-sticker" : "border border-sticker-border",
        className
      )}
      {...props}
    >
      <div
        id={`${id}-prompt`}
        className="sticker-caption bg-sticker-header px-4 py-3 text-lg text-sticker-header-fg"
      >
        {prompt}
      </div>
      {composing ? (
        <form
          className="flex flex-col gap-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) onSubmit?.(text.trim());
          }}
        >
          <textarea
            aria-labelledby={`${id}-prompt`}
            value={text}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled || loading}
            rows={3}
            className="field-sizing-content min-h-20 w-full resize-none rounded-md bg-surface-muted px-3.5 py-3 text-base text-fg outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-fg-subtle tabular-nums">
              {maxLength ? `${text.length}/${maxLength}` : null}
            </span>
            <Button type="submit" loading={loading} disabled={disabled || !text.trim()}>
              {submitLabel}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 text-base">{children}</div>
      )}
    </div>
  );
}
