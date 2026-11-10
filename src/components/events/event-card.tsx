"use client";

import { CalendarDays, Check, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoopPointsSticker } from "@/components/ui/stickers";
import { cn } from "@/lib/utils";
import { EventCountdownTag, GoingSticker } from "./event-countdown-tag";
import { EventDateTile } from "./event-date-tile";

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  bannerUrl: string | null;
  clubName: string;
  organizer?: { id: string; username: string; displayName: string; avatarUrl: string | null } | null;
  institution?: { id: string; name: string; slug?: string } | null;
  eligibleInstitutionIds: string[];
  eventType: string;
  mode: string;
  venue: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  participationType: string;
  entryFee: string;
  prizesDescription: string | null;
  perks: string[];
  loopPointsReward: number;
  attendeeCount: number;
  recentAttendees?: Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>;
  isRegistered: boolean;
  reminderSet: boolean;
  status?: string;
  isClosingSoon?: boolean;
  isClosed?: boolean;
  isLiveNow?: boolean;
  createdAt?: string;
}

interface EventCardProps {
  event: EventItem;
  variant?: "row" | "grid";
}

export function isEventClosed(event: EventItem, nowMs = Date.now()) {
  if (event.status === "COMPLETED" || event.status === "CLOSED" || event.status === "CANCELLED") return true;
  const endMs = new Date(event.endDate).getTime();
  if (Number.isFinite(endMs) && nowMs > endMs) return true;
  if (event.registrationDeadline) {
    const deadlineMs = new Date(event.registrationDeadline).getTime();
    if (Number.isFinite(deadlineMs) && nowMs > deadlineMs) return true;
  }
  return false;
}

export function eventModeLabel(mode: string) {
  if (mode === "ONLINE") return "Online";
  if (mode === "HYBRID") return "Online + on campus";
  return "On campus";
}

export function eventTypeLabel(type: string) {
  const t = String(type || "event")
    .toLowerCase()
    .replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function safePosterUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    // The older catalog has generic Unsplash stock photos, not event posters.
    if (parsed.hostname.toLowerCase() === "images.unsplash.com") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function eventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

function Poster({ event, className }: { event: EventItem; className?: string }) {
  const [failed, setFailed] = useState(false);
  const url = safePosterUrl(event.bannerUrl);
  if (!url || failed) return null;
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("size-full object-cover", className)}
    />
  );
}

function useQuickRegister(event: EventItem, closed: boolean) {
  const [isRegistered, setIsRegistered] = useState(Boolean(event.isRegistered));
  const [attendeeCount, setAttendeeCount] = useState(event.attendeeCount || 0);
  const [isMutating, setIsMutating] = useState(false);

  async function register() {
    if (isRegistered || isMutating || closed || event.participationType === "TEAM") return;
    setIsMutating(true);
    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok)
        throw new Error(data.error || "Couldn't register you. Check your connection and try again.");
      setIsRegistered(true);
      setAttendeeCount((count) => count + 1);
      toast.success("You're in. Find your pass in My tickets.");
      void mutate((key) => typeof key === "string" && key.startsWith("/api/events"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't register you. Try again.");
    } finally {
      setIsMutating(false);
    }
  }

  return { isRegistered, attendeeCount, isMutating, register };
}

export function EventCard({ event, variant = "row" }: EventCardProps) {
  const href = `/events/${event.slug || event.id}`;
  const closed = isEventClosed(event);
  const { isRegistered, attendeeCount, isMutating, register } = useQuickRegister(event, closed);
  const start = new Date(event.startDate);
  const now = new Date();
  const end = new Date(event.endDate);
  const live = !closed && !Number.isNaN(start.getTime()) && start <= now && now <= end;
  const restricted =
    Array.isArray(event.eligibleInstitutionIds) && !event.eligibleInstitutionIds.includes("ALL");
  const place = event.mode === "ONLINE" ? "Online" : event.venue || eventModeLabel(event.mode);
  const hasPoster = Boolean(safePosterUrl(event.bannerUrl));

  const action = closed ? (
    <Badge variant="neutral">Closed</Badge>
  ) : isRegistered ? (
    <Badge variant="verified">
      <Check aria-hidden /> You're going
    </Badge>
  ) : event.participationType === "TEAM" ? (
    <Button asChild size="sm" variant="outline">
      <Link href={href}>See details</Link>
    </Button>
  ) : (
    <Button size="sm" onClick={() => void register()} loading={isMutating}>
      Register
    </Button>
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="size-4" aria-hidden />
        {eventDate(event.startDate)}
      </span>
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <MapPin className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{place}</span>
      </span>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex min-w-0 items-center gap-2 text-sm text-fg-muted">
        <GoingSticker count={attendeeCount} />
        <span className="truncate">{event.entryFee || "Free"}</span>
      </span>
      {action}
    </div>
  );

  const badges = (
    <div className="flex flex-wrap items-center gap-1.5">
      {live && <Badge variant="danger">Live now</Badge>}
      <Badge variant="neutral">{eventTypeLabel(event.eventType)}</Badge>
      {restricted && <Badge variant="outline">Selected colleges</Badge>}
      {event.loopPointsReward > 0 && (
        <LoopPointsSticker points={event.loopPointsReward} label="points" size="sm" className="h-7 shadow-none" />
      )}
    </div>
  );

  const deadlineMs = event.registrationDeadline ? new Date(event.registrationDeadline).getTime() : Number.NaN;
  const countdown =
    closed || live ? null : Number.isFinite(deadlineMs) && deadlineMs < start.getTime() ? (
      <EventCountdownTag label="Registration closes in" target={event.registrationDeadline} />
    ) : (
      <EventCountdownTag label="Starts in" target={event.startDate} />
    );

  if (variant === "grid") {
    return (
      <article className="overflow-hidden rounded-lg border border-border bg-surface">
        <Link href={href} className="block aspect-[16/9] overflow-hidden bg-surface-muted">
          {hasPoster ? (
            <Poster event={event} />
          ) : (
            <div className="flex size-full items-center justify-center">
              <EventDateTile date={event.startDate} size="lg" />
            </div>
          )}
        </Link>
        <div className="space-y-3 p-4">
          {badges}
          <div>
            <Link
              href={href}
              className="line-clamp-2 font-display text-lg font-bold leading-snug text-fg hover:text-brand-text"
            >
              {event.title}
            </Link>
            <p className="mt-0.5 truncate text-sm text-fg-muted">{event.clubName}</p>
          </div>
          {meta}
          {countdown}
          {footer}
        </div>
      </article>
    );
  }

  return (
    <article className="flex gap-3 rounded-lg border border-border bg-surface p-3 sm:gap-4 sm:p-4">
      <Link
        href={href}
        aria-hidden
        tabIndex={-1}
        className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm sm:h-24 sm:w-20"
      >
        {hasPoster ? (
          <Poster event={event} />
        ) : (
          <EventDateTile date={event.startDate} className="h-full w-full" />
        )}
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        {badges}
        <div>
          <Link href={href} className="line-clamp-2 font-semibold leading-snug text-fg hover:text-brand-text">
            {event.title}
          </Link>
          <p className="truncate text-sm text-fg-muted">{event.clubName}</p>
        </div>
        {meta}
        {countdown}
        {event.prizesDescription && (
          <p className="inline-flex max-w-full items-center gap-1.5 text-sm text-fg">
            <Trophy className="size-4 shrink-0 text-fg-muted" aria-hidden />
            <span className="truncate">{event.prizesDescription}</span>
          </p>
        )}
        {footer}
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-surface p-3 sm:gap-4 sm:p-4" aria-hidden>
      <div className="h-20 w-16 shrink-0 animate-pulse rounded-sm bg-surface-muted sm:h-24 sm:w-20" />
      <div className="flex-1 space-y-2.5">
        <div className="h-5 w-24 animate-pulse rounded-full bg-surface-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded-sm bg-surface-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded-sm bg-surface-muted" />
      </div>
    </div>
  );
}
