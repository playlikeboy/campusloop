"use client";

import {
  ArrowLeft,
  Brain,
  Crown,
  Flame,
  ImageIcon,
  Laugh,
  type LucideIcon,
  Medal,
  Split,
  Swords,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { toast } from "sonner";
import type { AchievementIcon } from "@/constants/play";
import { PLAY_ROUTES } from "@/constants/play";
import { cn } from "@/lib/utils";

export const ACHIEVEMENT_ICONS: Record<AchievementIcon, LucideIcon> = {
  swords: Swords,
  trophy: Trophy,
  crown: Crown,
  medal: Medal,
  laugh: Laugh,
  image: ImageIcon,
  brain: Brain,
  target: Target,
  flame: Flame,
  split: Split,
  users: Users,
};

/**
 * Page header for Play screens. The title always gets the full width and may
 * wrap to two lines; actions sit underneath so they never squeeze it.
 */
export function PlayHeader({
  title,
  description,
  backHref = PLAY_ROUTES.hub,
  backLabel = "Back to Play",
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  backHref?: string | null;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="space-y-3 pt-4">
      {backHref && (
        <Link
          href={backHref}
          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {backLabel}
        </Link>
      )}
      <div className="space-y-1.5">
        <h1 className="text-3xl leading-tight text-balance text-fg sm:text-4xl">{title}</h1>
        {description && <p className="max-w-prose text-base text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Section with a title that always outranks its buttons. */
export function PlaySection({
  title,
  id,
  children,
  aside,
  className,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id={id} className="text-xl text-fg">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Rank number tile used in leaderboards. */
export function RankTile({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-sm text-sm font-bold tabular-nums",
        rank === 1 ? "bg-reward text-reward-fg" : "bg-surface-muted text-fg"
      )}
    >
      {rank}
    </span>
  );
}

/** Formats a time left until `endsAt` as "2d 4h" or "3h 10m". */
export function timeLeft(endsAt: number, now = Date.now()): string {
  const ms = Math.max(0, endsAt - now);
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d}d ${h % 24}h`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h >= 1 ? `${h}h ${m}m` : `${m}m`;
}

/** Toasts each badge the server just awarded. */
export function announceBadges(badges?: Array<{ title: string; lp: number }>) {
  for (const b of badges ?? []) {
    toast.success(`Badge unlocked: ${b.title}`, {
      description: `+${b.lp} Loop Points`,
      action: { label: "See badges", onClick: () => window.location.assign(PLAY_ROUTES.achievements) },
    });
  }
}
