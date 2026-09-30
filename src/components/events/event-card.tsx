"use client";

import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Globe,
  MapPin,
  School,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl } from "@/lib/utils";
import { AddToCalendarDropdown } from "./add-to-calendar-dropdown";

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  bannerUrl: string | null;
  clubName: string;
  organizer?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  institution?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
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
  recentAttendees?: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  }>;
  isRegistered: boolean;
  reminderSet: boolean;
  status?: string;
}

interface EventCardProps {
  event: EventItem;
  variant?: "row" | "grid";
}

export function isEventClosed(event: EventItem, nowMs: number = Date.now()): boolean {
  if (event.status === "COMPLETED" || event.status === "CLOSED" || event.status === "CANCELLED") {
    return true;
  }
  const endMs = new Date(event.endDate).getTime();
  if (nowMs > endMs) return true;

  if (event.registrationDeadline) {
    const deadlineMs = new Date(event.registrationDeadline).getTime();
    if (nowMs > deadlineMs) return true;
  }
  return false;
}

export function EventCard({ event, variant = "row" }: EventCardProps) {
  const [isRegistered, setIsRegistered] = useState(event.isRegistered);
  const [attendeeCount, setAttendeeCount] = useState(event.attendeeCount);
  const [isMutating, setIsMutating] = useState(false);

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const now = new Date();

  const closed = isEventClosed(event, now.getTime());
  const isOngoing = !closed && now >= startDate && now <= endDate;
  const timeDiffToStart = startDate.getTime() - now.getTime();
  const startsSoon = !closed && !isOngoing && timeDiffToStart > 0 && timeDiffToStart < 24 * 60 * 60 * 1000;
  const hoursUntilStart = Math.max(1, Math.round(timeDiffToStart / (1000 * 60 * 60)));

  const dateStr = startDate.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: startDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });

  const isRestricted =
    Array.isArray(event.eligibleInstitutionIds) && !event.eligibleInstitutionIds.includes("ALL");

  // Registration deadline calculations
  const deadlineDate = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  let deadlineStatus: { label: string; isUrgent: boolean } | null = null;

  if (closed) {
    deadlineStatus = { label: "Registration Closed", isUrgent: false };
  } else if (deadlineDate) {
    const diffMs = deadlineDate.getTime() - now.getTime();
    if (diffMs <= 0) {
      deadlineStatus = { label: "Registration Closed", isUrgent: false };
    } else {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays >= 1) {
        deadlineStatus = { label: `${diffDays}d left to register`, isUrgent: diffDays <= 2 };
      } else {
        deadlineStatus = { label: `${diffHours}h left`, isUrgent: true };
      }
    }
  }

  const displayBanner =
    event.bannerUrl ||
    `https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80`;

  async function handleQuickRegister(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isRegistered || isMutating || closed) return;

    sounds.tap();
    haptics.medium();
    setIsMutating(true);

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to register");
      }

      setIsRegistered(true);
      setAttendeeCount((prev) => prev + 1);
      sounds.pop();
      haptics.heavy();
      toast.success("Registered for event! +25 Loop Points");
      mutate("/api/events");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setIsMutating(false);
    }
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/events/${event.slug || event.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      sounds.tap();
      haptics.light();
      toast.success("Event link copied to clipboard!");
    }
  }

  // ─── Grid View Variant (Clean Unstop Card) ───
  if (variant === "grid") {
    return (
      <Link
        href={`/events/${event.slug || event.id}`}
        className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card hover:border-border transition-all duration-200 hover:shadow-md overflow-hidden"
      >
        <div>
          {/* Banner with clean semantic overlays */}
          <div className="relative aspect-16/9 w-full overflow-hidden bg-muted/40">
            <img
              src={displayBanner}
              alt={event.title}
              loading="lazy"
              className={cn(
                "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
                closed && "grayscale-[35%] opacity-90"
              )}
            />

            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />

            {/* Top Left: Category & Live Indicator */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white tracking-wide border border-white/10">
                {event.eventType.toLowerCase().replace(/_/g, " ")}
              </span>

              {isOngoing ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-600/90 text-white backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                  <span className="size-1.5 rounded-full bg-white animate-ping" />
                  Live
                </span>
              ) : startsSoon ? (
                <span className="rounded-md bg-amber-500/90 text-zinc-950 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold">
                  Starts in {hoursUntilStart}h
                </span>
              ) : closed ? (
                <span className="rounded-md bg-zinc-800/90 text-zinc-300 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium border border-white/10">
                  Ended
                </span>
              ) : null}
            </div>

            {/* Top Right: Mode (Online/Offline) */}
            <div className="absolute top-2.5 right-2.5">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md border",
                  event.mode === "ONLINE"
                    ? "bg-sky-950/80 text-sky-200 border-sky-400/20"
                    : "bg-emerald-950/80 text-emerald-200 border-emerald-400/20"
                )}
              >
                {event.mode === "ONLINE" ? "Online" : "On-Campus"}
              </span>
            </div>

            {/* Bottom floating deadline */}
            {deadlineStatus && (
              <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-medium text-white/95">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-semibold truncate max-w-full",
                    deadlineStatus.isUrgent
                      ? "bg-rose-600/90 text-white font-bold"
                      : closed
                        ? "bg-black/60 text-zinc-300"
                        : "bg-black/60 text-amber-200 border border-white/10"
                  )}
                >
                  {deadlineStatus.label}
                </span>
                {event.entryFee && (
                  <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10">
                    {event.entryFee}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="p-3.5 sm:p-4 space-y-2.5">
            {/* Organizer & Scope */}
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-foreground/90 truncate text-[11px] sm:text-xs">
                  {event.clubName}
                </span>
              </div>

              {isRestricted ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground shrink-0">
                  <School className="size-3 text-primary shrink-0" />
                  <span>Campus Only</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground shrink-0">
                  <Globe className="size-3 text-muted-foreground shrink-0" />
                  <span>All India</span>
                </span>
              )}
            </div>

            {/* Title & Tagline */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {event.title}
              </h3>
              {event.tagline && (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground leading-relaxed">
                  {event.tagline}
                </p>
              )}
            </div>

            {/* Key Metadata Strip (Unstop Style) */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs text-muted-foreground border-t border-border/40">
              <div className="flex items-center gap-1">
                <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium text-[11px]">{dateStr}</span>
              </div>

              <div className="flex items-center gap-1">
                <Users className="size-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium text-[11px]">
                  {event.participationType === "TEAM"
                    ? "Team"
                    : event.participationType === "BOTH"
                      ? "Solo / Team"
                      : "Individual"}
                </span>
              </div>

              {event.prizesDescription && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                  <Trophy className="size-3.5 shrink-0" />
                  <span className="truncate max-w-[130px]">{event.prizesDescription}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Attendees + CTA */}
        <div className="flex items-center justify-between border-t border-border/40 px-3.5 sm:px-4 py-2.5 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            {event.recentAttendees && event.recentAttendees.length > 0 ? (
              <div className="flex items-center -space-x-1.5 shrink-0">
                {event.recentAttendees.slice(0, 3).map((att) => (
                  <img
                    key={att.id}
                    src={getAvatarUrl(att.avatarUrl, att.username)}
                    alt={att.displayName || att.username}
                    className="size-5 rounded-full border-2 border-background object-cover bg-muted shrink-0"
                    title={`@${att.username}`}
                  />
                ))}
              </div>
            ) : null}

            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {attendeeCount} {attendeeCount === 1 ? "student" : "students"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              title="Share event link"
              className="flex size-7.5 items-center justify-center rounded-lg border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Share2 className="size-3.5" />
            </button>

            <AddToCalendarDropdown
              event={{
                id: event.id,
                title: event.title,
                description: event.description,
                venue: event.venue,
                mode: event.mode,
                startDate: event.startDate,
                endDate: event.endDate,
                slug: event.slug,
                clubName: event.clubName,
              }}
              variant="button"
            />

            {closed ? (
              <span className="inline-flex h-7.5 items-center px-3 rounded-lg border border-border/60 bg-muted/60 text-muted-foreground text-xs font-semibold">
                Closed
              </span>
            ) : isRegistered ? (
              <span className="inline-flex h-7.5 items-center gap-1 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <Check className="size-3.5" />
                Joined
              </span>
            ) : (
              <button
                type="button"
                onClick={event.participationType === "TEAM" ? undefined : handleQuickRegister}
                disabled={isMutating}
                className="inline-flex h-7.5 items-center gap-1 px-3 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {event.participationType === "TEAM" ? "Team" : "RSVP"}
              </button>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // ─── Row / List View Variant (Standard Unstop Timeline Card) ───
  return (
    <Link
      href={`/events/${event.slug || event.id}`}
      className="group relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-border/60 bg-card hover:border-border transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Thumbnail */}
        <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl bg-muted/40 aspect-square border border-border/30">
          <img
            src={displayBanner}
            alt={event.title}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
              closed && "grayscale-[35%] opacity-90"
            )}
          />

          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

          {/* Mode Pill */}
          <div className="absolute top-1 left-1 rounded px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white">
            {event.mode === "ONLINE" ? "Online" : "Campus"}
          </div>

          {isOngoing ? (
            <div className="absolute top-1 right-1 rounded px-1.5 py-0.2 text-[8px] font-bold uppercase bg-rose-600/90 text-white">
              Live
            </div>
          ) : closed ? (
            <div className="absolute top-1 right-1 rounded px-1.5 py-0.2 text-[8px] font-bold bg-zinc-800/90 text-zinc-300">
              Ended
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Organizer & Meta */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground/90 truncate max-w-[140px] sm:max-w-none">
              {event.clubName}
            </span>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span className="capitalize font-medium text-foreground/80">
              {event.eventType.toLowerCase().replace(/_/g, " ")}
            </span>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            {isRestricted ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <School className="size-3 text-primary shrink-0" />
                <span>Campus Only</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Globe className="size-3 shrink-0" />
                <span>All India</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1 sm:line-clamp-2">
            {event.title}
          </h3>

          {/* Highlights Row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium text-[11px]">{dateStr}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1">
              <Users className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium text-[11px]">
                {event.participationType === "TEAM"
                  ? "Team"
                  : event.participationType === "BOTH"
                    ? "Solo / Team"
                    : "Solo"}
              </span>
            </div>

            {event.prizesDescription && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                <Trophy className="size-3.5 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[180px]">{event.prizesDescription}</span>
              </div>
            )}

            {deadlineStatus && (
              <span
                className={cn(
                  "text-[11px] font-medium",
                  deadlineStatus.isUrgent
                    ? "text-rose-600 dark:text-rose-400 font-semibold"
                    : closed
                      ? "text-muted-foreground"
                      : "text-muted-foreground"
                )}
              >
                · {deadlineStatus.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column / Actions Strip */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0">
        <div className="text-right">
          <p className="text-xs font-bold text-foreground">{event.entryFee || "Free"}</p>
          <p className="text-[10px] text-muted-foreground font-medium">
            {attendeeCount} registered
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            title="Share event link"
            className="flex size-7.5 items-center justify-center rounded-lg border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Share2 className="size-3.5" />
          </button>

          <AddToCalendarDropdown
            event={{
              id: event.id,
              title: event.title,
              description: event.description,
              venue: event.venue,
              mode: event.mode,
              startDate: event.startDate,
              endDate: event.endDate,
              slug: event.slug,
              clubName: event.clubName,
            }}
            variant="button"
          />

          {closed ? (
            <span className="inline-flex h-8 items-center px-3 rounded-lg border border-border/60 bg-muted/60 text-muted-foreground text-xs font-semibold">
              Closed
            </span>
          ) : isRegistered ? (
            <span className="inline-flex h-8 items-center gap-1 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <Check className="size-3.5" />
              Joined
            </span>
          ) : (
            <button
              type="button"
              onClick={event.participationType === "TEAM" ? undefined : handleQuickRegister}
              disabled={isMutating}
              className="inline-flex h-8 items-center gap-1 px-3.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <span>{event.participationType === "TEAM" ? "Team" : "RSVP"}</span>
              <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
