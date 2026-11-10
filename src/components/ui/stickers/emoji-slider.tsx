"use client";

import { Flame } from "lucide-react";
import type * as React from "react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

export interface EmojiSliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** The question, e.g. "How hard was the mid-sem?" */
  label: React.ReactNode;
  /** 0–100. Uncontrolled when omitted. */
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Fires when the student lets go (pointer up / key up). Save the reaction here. */
  onCommit?: (value: number) => void;
  /** Thumb content: the reaction the poster picked (an emoji string is fine here), or an icon. */
  thumb?: React.ReactNode;
  /** Everyone's average (0–100), shown as a marker after the student reacts. */
  average?: number;
  disabled?: boolean;
  variant?: "sticker" | "flat";
}

/** Emoji slider reaction. A real range input underneath: arrows, Home/End and screen readers work. */
export function EmojiSlider({
  label,
  value,
  defaultValue = 50,
  onChange,
  onCommit,
  thumb,
  average,
  disabled,
  variant = "sticker",
  className,
  ...props
}: EmojiSliderProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const v = value ?? inner;
  const set = (n: number) => {
    if (value === undefined) setInner(n);
    onChange?.(n);
  };

  return (
    <div
      data-slot="emoji-slider"
      className={cn(
        "flex flex-col gap-4 rounded-sticker bg-sticker p-4 text-sticker-fg",
        variant === "sticker" ? "shadow-sticker" : "border border-sticker-border",
        className
      )}
      {...props}
    >
      <label htmlFor={id} className="sticker-caption text-center text-lg text-balance">
        {label}
      </label>
      <div className="relative flex h-11 items-center">
        <div aria-hidden="true" className="absolute inset-x-0 h-2 overflow-hidden rounded-full bg-poll-track">
          <div className="h-full rounded-full bg-brand" style={{ width: `${v}%` }} />
        </div>
        {typeof average === "number" && (
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg"
            style={{ left: `${average}%` }}
          />
        )}
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={v}
          disabled={disabled}
          aria-valuetext={`${v} out of 100`}
          onChange={(e) => set(Number(e.target.value))}
          onPointerUp={(e) => onCommit?.(Number(e.currentTarget.value))}
          onKeyUp={(e) => onCommit?.(Number(e.currentTarget.value))}
          className="peer absolute inset-0 z-10 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-sticker text-2xl text-brand-text shadow-sticker",
            "transition-ui peer-active:scale-110 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:opacity-60"
          )}
          style={{ left: `clamp(22px, ${v}%, calc(100% - 22px))` }}
        >
          {thumb ?? <Flame className="size-6" />}
        </span>
      </div>
      {typeof average === "number" && (
        <p className="text-center text-xs font-medium text-fg-muted">Line shows the class average</p>
      )}
    </div>
  );
}
