"use client";

import { Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { Sticker } from "@/components/ui/stickers";
import { cn } from "@/lib/utils";

function left(ms: number) {
  const min = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

/**
 * Compact, flat countdown for list rows. The full CountdownSticker is too tall for a card,
 * so this shows one line: "Starts in 2d 4h". Renders nothing on the server and once the time has passed.
 */
export function EventCountdownTag({
  label,
  target,
  className,
}: {
  /** e.g. "Starts in" or "Registration closes in". */
  label: string;
  target: string | Date | null | undefined;
  className?: string;
}) {
  const end = target ? new Date(target).getTime() : Number.NaN;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  if (now === null || !Number.isFinite(end) || end <= now) return null;

  return (
    <Sticker
      flat
      className={cn("flex h-7 w-fit max-w-full items-center gap-1.5 px-2.5 text-xs font-semibold", className)}
    >
      <Timer aria-hidden="true" className="size-3.5 shrink-0 text-brand-text" />
      <span className="truncate">
        {label}{" "}
        <time dateTime={new Date(end).toISOString()} className="sticker-caption text-sm tabular-nums">
          {left(end - now)}
        </time>
      </span>
    </Sticker>
  );
}

/** "128 going" as a small flat sticker. Real RSVP count only. */
export function GoingSticker({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <Sticker
      flat
      className={cn("inline-flex h-7 shrink-0 items-center gap-1 px-2.5 text-xs font-semibold", className)}
    >
      <span className="sticker-caption text-sm tabular-nums">{count.toLocaleString("en-IN")}</span> going
    </Sticker>
  );
}
