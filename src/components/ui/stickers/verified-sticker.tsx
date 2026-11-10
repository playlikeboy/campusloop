import { BadgeCheck } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

export interface VerifiedStickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What was verified, in plain words. */
  label?: string;
  /** Optional college name shown after the label. */
  college?: string;
  size?: "sm" | "md";
  /** "flat" drops the lift shadow, for badges inline with text (post headers, list rows). */
  variant?: "sticker" | "flat";
}

/** Mint "verified" sticker. Mint means verified / safe; use it for nothing else. */
export function VerifiedSticker({
  label = "Verified student",
  college,
  size = "md",
  variant = "sticker",
  className,
  ...props
}: VerifiedStickerProps) {
  return (
    <div
      data-slot="verified-sticker"
      className={cn(
        "inline-flex max-w-full items-center rounded-full bg-verified font-semibold text-verified-fg",
        variant === "sticker" && "shadow-sticker",
        size === "sm" ? "h-7 gap-1 px-2.5 text-xs" : "h-9 gap-1.5 px-3.5 text-sm",
        className
      )}
      {...props}
    >
      <BadgeCheck aria-hidden="true" className={size === "sm" ? "size-3.5" : "size-4"} />
      <span className="truncate">
        {label}
        {college && <span className="font-medium"> · {college}</span>}
      </span>
    </div>
  );
}
