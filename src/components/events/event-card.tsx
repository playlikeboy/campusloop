"use client";

import { CalendarDays, Check, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

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

function eventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export function EventCard({ event, variant = "row" }: EventCardProps) {
  const [isRegistered, setIsRegistered] = useState(Boolean(event.isRegistered));
  const [attendeeCount, setAttendeeCount] = useState(event.attendeeCount || 0);
  const [isMutating, setIsMutating] = useState(false);
  const href = "/events/" + (event.slug || event.id);
  const closed = isEventClosed(event);
  const start = new Date(event.startDate);
  const now = new Date();
  const end = new Date(event.endDate);
  const live = !closed && !Number.isNaN(start.getTime()) && start <= now && now <= end;
  const restricted = Array.isArray(event.eligibleInstitutionIds) && !event.eligibleInstitutionIds.includes("ALL");
  const modeLabel = event.mode === "ONLINE" ? "Online" : event.mode === "HYBRID" ? "Hybrid" : "On campus";
  const banner = event.bannerUrl || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=900&auto=format&fit=crop&q=80";

  async function handleQuickRegister() {
    if (isRegistered || isMutating || closed || event.participationType === "TEAM") return;
    setIsMutating(true);
    try {
      const response = await fetch("/api/events/" + event.id + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not register");
      setIsRegistered(true);
      setAttendeeCount((count) => count + 1);
      toast.success("You’re registered");
      void mutate((key) => typeof key === "string" && key.startsWith("/api/events"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not register");
    } finally {
      setIsMutating(false);
    }
  }

  const action = closed ? (
    <span className="inline-flex h-8 items-center rounded-full bg-muted px-3 text-xs font-semibold text-muted-foreground">Closed</span>
  ) : isRegistered ? (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      <Check className="size-3.5" /> Joined
    </span>
  ) : event.participationType === "TEAM" ? (
    <Link href={href} className="inline-flex h-8 items-center rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Team details</Link>
  ) : (
    <button type="button" onClick={() => void handleQuickRegister()} disabled={isMutating} className="inline-flex h-8 items-center rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
      {isMutating ? "Joining…" : "RSVP"}
    </button>
  );

  if (variant === "grid") {
    return (
      <article className="overflow-hidden rounded-2xl bg-card transition-colors hover:bg-muted/20">
        <Link href={href} className="group block">
          <div className="relative aspect-[16/9] overflow-hidden bg-muted/40">
            <img src={banner} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white">{event.eventType.toLowerCase().replace(/_/g, " ")}</span>
            {live && <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white">Live</span>}
          </div>
          <div className="space-y-2.5 p-4">
            <p className="truncate text-xs text-muted-foreground">{event.clubName}</p>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{eventDate(event.startDate)}</span>
              <span>{modeLabel}</span>
              {restricted && <span>Campus only</span>}
            </div>
            {(event.prizesDescription || event.entryFee) && (
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-foreground">{event.entryFee || "Free"}</span>
                {event.prizesDescription && <span className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-amber-600 dark:text-amber-400"><Trophy className="size-3.5 shrink-0" />{event.prizesDescription}</span>}
              </div>
            )}
          </div>
        </Link>
        <div className="flex items-center justify-between gap-3 px-4 pb-4">
          <span className="text-xs text-muted-foreground">{attendeeCount} joined</span>
          {action}
        </div>
      </article>
    );
  }

  return (
    <article className="flex gap-3 rounded-2xl bg-card p-3 transition-colors hover:bg-muted/20 sm:items-center sm:gap-4 sm:p-3.5">
      <Link href={href} className="relative size-[76px] shrink-0 overflow-hidden rounded-xl bg-muted/40 sm:size-24">
        <img src={banner} alt="" loading="lazy" className="size-full object-cover" />
        {live && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <span className="truncate text-[11px] font-medium text-muted-foreground">{event.clubName}</span>
          {restricted && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">Campus</span>}
        </div>
        <Link href={href} className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-primary">{event.title}</Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{eventDate(event.startDate)}</span>
          <span>{modeLabel}</span>
          {event.prizesDescription && <span className="inline-flex max-w-full items-center gap-1 truncate font-medium text-amber-600 dark:text-amber-400"><Trophy className="size-3 shrink-0" /><span className="truncate">{event.prizesDescription}</span></span>}
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <Users className="size-3.5 shrink-0" />{attendeeCount} joined <span aria-hidden>·</span>{event.entryFee || "Free"}
          </span>
          {action}
        </div>
      </div>
    </article>
  );
}
