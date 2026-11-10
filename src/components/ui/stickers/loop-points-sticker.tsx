import { Coins } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

export interface LoopPointsStickerProps extends React.HTMLAttributes<HTMLDivElement> {
  points: number;
  /** Short label after the number. */
  label?: string;
  size?: "sm" | "md";
  pop?: boolean;
}

const fmt = new Intl.NumberFormat("en-IN");

/** Yellow Loop Points sticker. Yellow means rewards; use it for nothing else. */
export function LoopPointsSticker({
  points,
  label = "Loop Points",
  size = "md",
  pop,
  className,
  ...props
}: LoopPointsStickerProps) {
  return (
    <div
      data-slot="loop-points-sticker"
      className={cn(
        "inline-flex items-center rounded-full bg-reward font-semibold text-reward-fg shadow-sticker",
        size === "sm" ? "h-8 gap-1.5 px-3 text-xs" : "h-10 gap-2 px-4 text-sm",
        pop && "sticker-pop",
        className
      )}
      {...props}
    >
      <Coins aria-hidden="true" className={size === "sm" ? "size-3.5" : "size-4"} />
      <span className="sticker-caption tabular-nums text-[1.15em]">{fmt.format(points)}</span>
      <span>{label}</span>
    </div>
  );
}
