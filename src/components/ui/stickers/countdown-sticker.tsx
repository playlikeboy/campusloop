"use client";

import { Timer } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface CountdownStickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** What is counting down, e.g. "Fest night". */
  title: React.ReactNode;
  /** When it starts. */
  target: Date | string | number;
  /** Shown once the time has passed. */
  doneLabel?: string;
  variant?: "sticker" | "flat";
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Countdown tiles, as on Stories. Renders "--" on the server, ticks on the client. */
export function CountdownSticker({
  title,
  target,
  doneLabel = "Happening now",
  variant = "sticker",
  className,
  ...props
}: CountdownStickerProps) {
  const end = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const left = now === null ? null : end - now;
  const p = left === null ? null : parts(left);
  const tiles: Array<[string, string]> = p
    ? p.d > 0
      ? [
          [String(p.d), "days"],
          [pad(p.h), "hrs"],
          [pad(p.m), "min"],
        ]
      : [
          [pad(p.h), "hrs"],
          [pad(p.m), "min"],
          [pad(p.s), "sec"],
        ]
    : [
        ["--", "days"],
        ["--", "hrs"],
        ["--", "min"],
      ];
  const spoken = p
    ? p.d > 0
      ? `${p.d} days ${p.h} hours left`
      : `${p.h} hours ${p.m} minutes left`
    : undefined;

  return (
    <div
      data-slot="countdown-sticker"
      className={cn(
        "flex flex-col gap-3 rounded-sticker bg-sticker p-4 text-sticker-fg",
        variant === "sticker" ? "shadow-sticker" : "border border-sticker-border",
        className
      )}
      {...props}
    >
      <p className="sticker-caption flex items-center gap-2 text-lg">
        <Timer aria-hidden="true" className="size-5 shrink-0 text-brand-text" />
        <span className="min-w-0">{title}</span>
      </p>
      {left !== null && left <= 0 ? (
        <p className="font-semibold text-brand-text">{doneLabel}</p>
      ) : (
        <time dateTime={new Date(end).toISOString()} aria-label={spoken} className="grid grid-cols-3 gap-2">
          {tiles.map(([n, unit]) => (
            <span key={unit} className="flex flex-col items-center rounded-md bg-fg py-2 text-bg">
              <span className="sticker-caption text-3xl tabular-nums">{n}</span>
              <span className="text-xs font-medium opacity-80">{unit}</span>
            </span>
          ))}
        </time>
      )}
    </div>
  );
}
