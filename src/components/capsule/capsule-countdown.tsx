"use client";

import { CountdownSticker } from "@/components/ui/stickers";

interface CapsuleCountdownProps {
  targetDate: string | Date;
  className?: string;
}

/** Time left until a capsule opens. Flat countdown tiles, calm enough for a list. */
export function CapsuleCountdown({ targetDate, className }: CapsuleCountdownProps) {
  return (
    <CountdownSticker
      variant="flat"
      title="Opens in"
      target={targetDate}
      doneLabel="Open now"
      className={className}
    />
  );
}
