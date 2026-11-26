"use client";

import { CalendarDays, Check, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoopPointsSticker } from "@/components/ui/stickers";
import { trackEventRegister } from "@/lib/analytics/ga4";
import { cn } from "@/lib/utils";
import { EventCountdownTag, GoingSticker } from "./event-countdown-tag";
import { EventDateTile } from "./event-date-tile";
import { istDate, istYear } from "@/lib/ist-date";

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
    // Dicebear shapes are generated placeholders, not posters either.
    const host = parsed.hostname.toLowerCase();
    if (host === "images.unsplash.com" || host === "api.dicebear.com") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function eventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  // India time, so the server and the browser render the same label.
  return istDate(date, { weekday: "short", year: istYear(date) !== istYear(new Date()) }) ?? "Date to be announced";
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
      trackEventRegister(event.id);
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

const DAY_MS = 24 * 60 * 60 * 1000;
/** Events that run longer than this are "open" windows (online challenges), not a thing happening right now. */
const LIVE_MAX_SPAN_MS = 3 * DAY_MS;
/** Countdowns only show when the moment is close enough to act on. */
const COUNTDOWN_WINDOW_MS = 7 * DAY_MS;

export type EventTiming =
  | { kind: "closed" }
  | { kind: "live" }
  | { kind: "open"; until: string }
  | { kind: "upcoming" };

/**
 * Where an event is in its lifecycle. "Live now" is reserved for short events that are
 * actually running (a 36-hour hackathon, a fest weekend). A competition that started weeks
 * ago and runs for months is "open" with the date it closes, never "live".
 */
export function eventTiming(event: EventItem, nowMs = Date.now()): EventTiming {
  if (isEventClosed(event, nowMs)) return { kind: "closed" };
  const startMs = new Date(event.startDate).getTime();
  const endMs = new Date(event.endDate).getTime();
  if (!Number.isFinite(startMs) || nowMs < startMs) return { kind: "upcoming" };
  const span = Number.isFinite(endMs) ? endMs - startMs : 0;
  if (span <= LIVE_MAX_SPAN_MS) return { kind: "live" };
  const deadlineMs = event.registrationDeadline ? new Date(event.registrationDeadline).getTime() : Number.NaN;
  const until = Number.isFinite(deadlineMs) && deadlineMs < endMs ? event.registrationDeadline : event.endDate;
  return { kind: "open", until: until as string };
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return istDate(date, { year: istYear(date) !== istYear(new Date()) }) ?? "Date TBA";
}

/** Compact date chip: "Sat, 28 Nov", "Live now" or "Open till 4 Dec". */
function EventDateChip({ event, timing }: { event: EventItem; timing: EventTiming }) {
  if (timing.kind === "live") {
    return (
      <Badge variant="danger" className="h-7 shrink-0">
        Live now
      </Badge>
    );
  }
  const label = timing.kind === "open" ? `Open till ${shortDate(timing.until)}` : eventDate(event.startDate);
  return (
    <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 text-xs font-semibold text-brand-text">
      <CalendarDays className="size-3.5" aria-hidden />
      <time dateTime={timing.kind === "open" ? timing.until : event.startDate}>{label}</time>
    </span>
  );
}

/** The one countdown worth showing on a card, or null when nothing is close. */
function cardCountdown(event: EventItem, timing: EventTiming, nowMs: number) {
  if (timing.kind === "closed" || timing.kind === "live") return null;
  const startMs = new Date(event.startDate).getTime();
  const deadlineMs = event.registrationDeadline ? new Date(event.registrationDeadline).getTime() : Number.NaN;
  const soon = (ms: number) => Number.isFinite(ms) && ms > nowMs && ms - nowMs <= COUNTDOWN_WINDOW_MS;
  if (timing.kind === "open") {
    const untilMs = new Date(timing.until).getTime();
    return soon(untilMs) ? { label: "Closes in", target: timing.until } : null;
  }
  if (soon(deadlineMs) && deadlineMs < startMs) {
    return { label: "Registration closes in", target: event.registrationDeadline as string };
  }
  return soon(startMs) ? { label: "Starts in", target: event.startDate } : null;
}

export function EventCard({ event, variant = "row" }: EventCardProps) {
  const href = `/events/${event.slug || event.id}`;
  const closed = isEventClosed(event);
  const { isRegistered, attendeeCount, isMutating, register } = useQuickRegister(event, closed);
  // Timing is computed on the client after mount so server and client markup agree.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => setNowMs(Date.now()), []);
  const timing: EventTiming = nowMs === null ? { kind: closed ? "closed" : "upcoming" } : eventTiming(event, nowMs);
  const countdown = nowMs === null ? null : cardCountdown(event, timing, nowMs);
  const restricted =
    Array.isArray(event.eligibleInstitutionIds) && !event.eligibleInstitutionIds.includes("ALL");
  const place = event.mode === "ONLINE" ? "Online" : event.venue || eventModeLabel(event.mode);
  const hasPoster = Boolean(safePosterUrl(event.bannerUrl));
  const prize = event.prizesDescription?.trim();

  const action = closed ? (
    <Badge variant="neutral">Closed</Badge>
  ) : isRegistered ? (
    <Badge variant="verified" className="h-8">
      <Check aria-hidden /> You're going
    </Badge>
  ) : event.participationType === "TEAM" ? (
    <Button asChild variant="outline">
      <Link href={href}>See details</Link>
    </Button>
  ) : (
    <Button onClick={() => void register()} loading={isMutating} className="px-5">
      Register
    </Button>
  );

  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-ui hover:border-border-strong">
      {(hasPoster || variant === "grid") && (
        <div
          className={cn(
            "overflow-hidden bg-surface-muted",
            variant === "grid" ? "aspect-[16/9]" : "aspect-[21/9] sm:aspect-[3/1]"
          )}
        >
          {hasPoster ? (
            <Poster event={event} />
          ) : (
            <div className="flex size-full items-center justify-center">
              <EventDateTile date={event.startDate} size="lg" />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <div className="flex min-w-0 items-center gap-2">
          <EventDateChip event={event} timing={timing} />
          <span className="min-w-0 truncate text-xs font-medium text-fg-muted">
            {eventTypeLabel(event.eventType)}
          </span>
          {event.loopPointsReward > 0 && (
            <LoopPointsSticker
              points={event.loopPointsReward}
              label="pts"
              size="sm"
              className="relative z-10 ml-auto h-7 shrink-0 px-2.5 shadow-none"
            />
          )}
        </div>
        <h3 className="font-display text-lg leading-snug font-bold text-fg">
          <Link
            href={href}
            className="line-clamp-2 break-words outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring hover:text-brand-text"
          >
            {event.title}
          </Link>
        </h3>
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-fg-muted">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="max-w-[45%] shrink-0 truncate">{place}</span>
          <span aria-hidden>·</span>
          {prize ? (
            <span className="inline-flex min-w-0 items-center gap-1 text-fg">
              <Trophy className="size-3.5 shrink-0 text-fg-muted" aria-hidden />
              <span className="truncate">{prize}</span>
            </span>
          ) : (
            <span className="min-w-0 truncate">{event.entryFee || "Free"}</span>
          )}
          {restricted && (
            <span className="hidden shrink-0 sm:inline">
              <span aria-hidden>· </span>Selected colleges
            </span>
          )}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            {countdown ? (
              <EventCountdownTag label={countdown.label} target={countdown.target} />
            ) : attendeeCount > 0 ? (
              <GoingSticker count={attendeeCount} />
            ) : (
              <span className="truncate text-sm text-fg-subtle">{event.clubName}</span>
            )}
          </div>
          <div className="relative z-10 shrink-0">{action}</div>
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-surface p-3.5 sm:p-4" aria-hidden>
      <div className="flex items-center gap-2">
        <div className="h-7 w-24 animate-pulse rounded-full bg-surface-muted" />
        <div className="h-4 w-16 animate-pulse rounded-sm bg-surface-muted" />
      </div>
      <div className="h-5 w-11/12 animate-pulse rounded-sm bg-surface-muted" />
      <div className="h-5 w-2/3 animate-pulse rounded-sm bg-surface-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded-sm bg-surface-muted" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-7 w-28 animate-pulse rounded-full bg-surface-muted" />
        <div className="h-11 w-28 animate-pulse rounded-full bg-surface-muted" />
      </div>
    </div>
  );
}
