"use client";

import { BriefcaseBusiness, CalendarDays, Check, Dumbbell, GraduationCap, MessageSquareText, Palette, Rocket, Sparkles, Trophy, Users, Wrench } from "lucide-react";
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


function categoryArtwork(eventType: string) {
  const type = String(eventType || "").toUpperCase();
  if (["INTERNSHIP", "JOB"].includes(type)) {
    return { gradient: "bg-brand", kicker: "Career growth", Icon: BriefcaseBusiness };
  }
  if (["SCHOLARSHIP", "FELLOWSHIP", "GRANT"].includes(type)) {
    return { gradient: "bg-brand", kicker: "Fund your future", Icon: GraduationCap };
  }
  if (type === "HACKATHON") {
    return { gradient: "bg-brand", kicker: "Build, ship, win", Icon: Rocket };
  }
  if (["COMPETITION", "CONTEST"].includes(type)) {
    return { gradient: "bg-brand", kicker: "Show what you can do", Icon: Trophy };
  }
  if (type === "WORKSHOP") {
    return { gradient: "bg-brand", kicker: "Learn by doing", Icon: Wrench };
  }
  if (type === "SEMINAR") {
    return { gradient: "bg-brand", kicker: "Ideas and insights", Icon: MessageSquareText };
  }
  if (type === "MEETUP") {
    return { gradient: "bg-brand", kicker: "Meet your people", Icon: Users };
  }
  if (["CULTURAL", "FEST"].includes(type)) {
    return { gradient: "bg-brand", kicker: "Campus culture", Icon: Palette };
  }
  if (type === "SPORTS") {
    return { gradient: "bg-brand", kicker: "Play to win", Icon: Dumbbell };
  }
  return { gradient: "bg-brand", kicker: "Your next opportunity", Icon: Sparkles };
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

function EventArtwork({ event, variant }: { event: EventItem; variant: "row" | "grid" }) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  const posterUrl = safePosterUrl(event.bannerUrl);
  const hasPoster = Boolean(posterUrl && failedPosterUrl !== posterUrl);
  const { gradient, kicker, Icon } = categoryArtwork(event.eventType);

  return (
    <div className={"relative size-full overflow-hidden " + gradient}>
      {!hasPoster && (
        <>
          <div className={"relative flex h-full flex-col justify-between p-4 " + (variant === "row" ? "items-center justify-center p-1.5" : "")}>
            <span className={"text-xs font-semibold text-brand-fg/80 " + (variant === "row" ? "hidden" : "")}>
              {kicker}
            </span>
            <div className={"flex items-center justify-between gap-3 " + (variant === "row" ? "justify-center" : "")}>
              <Icon className={"text-white/90 drop-shadow-sm " + (variant === "row" ? "size-7" : "size-12")} strokeWidth={1.5} />
              {variant === "grid" && <Sparkles className="size-5 text-white/70" strokeWidth={1.5} />}
            </div>
            {variant === "grid" && (
              <h3 className="line-clamp-2 max-w-[92%] text-base font-semibold tracking-tight text-white drop-shadow-sm">
                {event.title}
              </h3>
            )}
          </div>
        </>
      )}
      {hasPoster && (
        <img
          src={posterUrl!}
          alt={event.title + " poster"}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedPosterUrl(posterUrl)}
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      )}
      {hasPoster && <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-black/5" />}
    </div>
  );
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

  async function handleQuickRegister() {
    if (isRegistered || isMutating || closed || event.participationType === "TEAM") return;
    setIsMutating(true);
    try {
      const response = await fetch("/api/events/" + event.id + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
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
    <span className="inline-flex min-h-10 sm:min-h-8 items-center rounded-full bg-muted px-3 text-xs font-semibold text-muted-foreground">Closed</span>
  ) : isRegistered ? (
    <span className="inline-flex min-h-10 sm:min-h-8 items-center gap-1.5 rounded-full bg-success-subtle px-3 text-xs font-semibold text-success">
      <Check className="size-3.5" /> Joined
    </span>
  ) : event.participationType === "TEAM" ? (
    <Link href={href} className="inline-flex min-h-10 sm:min-h-8 items-center rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Team details</Link>
  ) : (
    <button type="button" onClick={() => void handleQuickRegister()} disabled={isMutating} className="inline-flex min-h-10 sm:min-h-8 items-center rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
      {isMutating ? "Joining…" : "RSVP"}
    </button>
  );

  if (variant === "grid") {
    return (
      <article className="overflow-hidden rounded-2xl bg-card transition-colors hover:bg-muted/20">
        <Link href={href} className="group block">
          <div className="relative aspect-[16/9] overflow-hidden bg-muted/40">
            <EventArtwork event={event} variant="grid" />
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white">{event.eventType.toLowerCase().replace(/_/g, " ")}</span>
            {live && <span className="absolute right-3 top-3 rounded-full bg-danger px-2.5 py-1 text-[10px] font-bold text-white">Live</span>}
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
                {event.prizesDescription && <span className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-warning"><Trophy className="size-3.5 shrink-0" />{event.prizesDescription}</span>}
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
        <EventArtwork event={event} variant="row" />
        {live && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-danger px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>}
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
          {event.prizesDescription && <span className="inline-flex max-w-full items-center gap-1 truncate font-medium text-warning"><Trophy className="size-3 shrink-0" /><span className="truncate">{event.prizesDescription}</span></span>}
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
