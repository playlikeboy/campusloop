import { Coins } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/navigation";
import { cn } from "@/lib/utils";

const fmt = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

/** Small yellow Loop Points chip for the top bar. Yellow means points, nothing else. Links to streaks. */
export function PointsChip({ points, className }: { points: number; className?: string }) {
  return (
    <Link
      href={ROUTES.streaks}
      prefetch
      aria-label={`${points} Loop Points. See your streak`}
      className={cn(
        "flex h-11 shrink-0 items-center rounded-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-reward px-3 text-reward-fg transition-[rotate] duration-200 ease-out hover:-rotate-2">
        <Coins className="size-4" aria-hidden="true" />
        <span className="sticker-caption text-sm tabular-nums">{fmt.format(points)}</span>
        <span className="hidden text-xs font-semibold sm:inline">LP</span>
      </span>
    </Link>
  );
}
