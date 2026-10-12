"use client";

import { BriefcaseBusiness, CalendarDays, Check, Dumbbell, GraduationCap, MessageSquareText, Palette, Rocket, Sparkles, Trophy, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
    return { gradient: "from-sky-700 via-blue-600 to-indigo-400", kicker: "CAREER GROWTH", Icon: BriefcaseBusiness };
  }
  if (["SCHOLARSHIP", "FELLOWSHIP", "GRANT"].includes(type)) {
    return { gradient: "from-amber-500 via-orange-500 to-pink-500", kicker: "FUND YOUR FUTURE", Icon: GraduationCap };
  }
  if (type === "HACKATHON") {
    return { gradient: "from-violet-700 via-indigo-500 to-cyan-400", kicker: "BUILD · SHIP · WIN", Icon: Rocket };
  }
  if (["COMPETITION", "CONTEST"].includes(type)) {
    return { gradient: "from-orange-600 via-rose-500 to-amber-400", kicker: "SHOW WHAT YOU CAN DO", Icon: Trophy };
  }
  if (type === "WORKSHOP") {
    return { gradient: "from-cyan-700 via-teal-500 to-emerald-400", kicker: "LEARN BY DOING", Icon: Wrench };
  }
  if (type === "SEMINAR") {
    return { gradient: "from-blue-700 via-indigo-500 to-violet-400", kicker: "IDEAS & INSIGHTS", Icon: MessageSquareText };
  }
  if (type === "MEETUP") {
    return { gradient: "from-teal-700 via-cyan-500 to-blue-400", kicker: "MEET YOUR PEOPLE", Icon: Users };
  }
  if (["CULTURAL", "FEST"].includes(type)) {
    return { gradient: "from-fuchsia-700 via-pink-500 to-rose-400", kicker: "CAMPUS CULTURE", Icon: Palette };
  }
  if (type === "SPORTS") {
    return { gradient: "from-lime-700 via-green-500 to-emerald-400", kicker: "PLAY TO WIN", Icon: Dumbbell };
  }
  return { gradient: "from-slate-800 via-slate-700 to-indigo-500", kicker: "YOUR NEXT OPPORTUNITY", Icon: Sparkles };
}

function safePosterUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function EventArtwork({ event, variant }: { event: EventItem; variant: "row" | "grid" }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [event.bannerUrl]);

  const posterUrl = safePosterUrl(event.bannerUrl);
  const hasPoster = Boolean(posterUrl && !imageFailed);
  const { gradient, kicker, Icon } = categoryArtwork(event.eventType);

  return (
    <div className={"relative size-full overflow-hidden bg-gradient-to-br " + gradient}>
      {!hasPoster && (
        <>
          <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full border border-white/15 bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 size-44 rounded-full bg-black/10 blur-2xl" />
          <div className={"relative flex h-full flex-col justify-between p-4 " + (variant === "row" ? "items-center justify-center p-1.5" : "")}>
            <span className={"text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 " + (variant === "row" ? "hidden" : "")}>
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
          onError={() => setImageFailed(true)}
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
            <EventArtwork event={event} variant="grid" />
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
        <EventArtwork event={event} variant="row" />
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
