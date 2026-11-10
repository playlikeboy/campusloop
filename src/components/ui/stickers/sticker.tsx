import type * as React from "react";

import { cn } from "@/lib/utils";

export type StickerTone = "default" | "brand" | "reward" | "crush" | "verified";

const TONES: Record<StickerTone, string> = {
  default: "bg-sticker text-sticker-fg",
  brand: "bg-brand text-brand-fg",
  reward: "bg-reward text-reward-fg",
  crush: "bg-crush text-crush-fg",
  verified: "bg-verified text-verified-fg",
};

export interface StickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Colour by meaning only: reward = Loop Points, crush = Campus Match, verified = verified/safe. */
  tone?: StickerTone;
  /** Marketing surfaces only. Operate screens keep stickers straight. */
  tilt?: "none" | "left" | "right";
  /** Plays the sticker-pop settle once on mount. Use on at most one sticker per screen. */
  pop?: boolean;
  /** `flat` drops the lift shadow for calm, in-list use (feed, settings). */
  flat?: boolean;
}

/** Base sticker tile: rounded, white (or a meaning colour), soft offset lift shadow. */
export function Sticker({
  tone = "default",
  tilt = "none",
  pop = false,
  flat = false,
  className,
  ...props
}: StickerProps) {
  return (
    <div
      data-slot="sticker"
      className={cn(
        "rounded-sticker",
        TONES[tone],
        flat ? "border border-sticker-border" : "shadow-sticker",
        tilt === "left" && "-rotate-3",
        tilt === "right" && "rotate-3",
        pop && "sticker-pop",
        className
      )}
      {...props}
    />
  );
}
