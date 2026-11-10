"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Dumbbell,
  GraduationCap,
  MessageSquareText,
  Palette,
  Rocket,
  Sparkles,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

interface EventItem {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  clubName: string;
  eventType: string;
  mode: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  participationType: string;
  entryFee: string;
  prizesDescription: string | null;
  attendeeCount: number;
  isRegistered: boolean;
  isLiveNow?: boolean;
}

function getCategoryConfig(eventType: string) {
  const type = String(eventType || "").toUpperCase();
  if (type === "HACKATHON") {
    return {
      tint: "bg-brand-subtle",
      accent: "text-brand-text",
      pill: "bg-brand/15 text-brand-text",
      Icon: Rocket,
    };
  }
  if (["CULTURAL", "FEST"].includes(type)) {
    return {
      tint: "bg-danger-subtle",
      accent: "text-danger",
      pill: "bg-danger/15 text-danger",
      Icon: Palette,
    };
  }
  if (["COMPETITION", "CONTEST"].includes(type)) {
    return {
      tint: "bg-warning-subtle",
      accent: "text-warning",
      pill: "bg-warning/15 text-warning",
      Icon: Trophy,
    };
  }
  if (type === "WORKSHOP") {
    return {
      tint: "bg-brand-subtle",
      accent: "text-brand-text",
      pill: "bg-brand/15 text-brand-text",
      Icon: Wrench,
    };
  }
  if (type === "SPORTS") {
    return {
      tint: "bg-success-subtle",
      accent: "text-success",
      pill: "bg-success/15 text-success",
      Icon: Dumbbell,
    };
  }
  if (["SCHOLARSHIP", "FELLOWSHIP"].includes(type)) {
    return {
      tint: "bg-warning-subtle",
      accent: "text-warning",
      pill: "bg-warning/15 text-warning",
      Icon: GraduationCap,
    };
  }
  return {
    tint: "bg-brand-subtle",
    accent: "text-primary",
    pill: "bg-primary/15 text-primary",
    Icon: Sparkles,
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "TBA";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function FeedEventCard({ event }: { event: EventItem }) {
  const [registered, setRegistered] = useState(Boolean(event.isRegistered));
  const [attendeeCount, setAttendeeCount] = useState(event.attendeeCount || 0);
  const [loading, setLoading] = useState(false);
  const href = `/events/${event.slug || event.id}`;
  const config = getCategoryConfig(event.eventType);
  const Icon = config.Icon;
  const isTeam = event.participationType === "TEAM";

  async function handleJoin(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (registered || loading) return;
    if (isTeam) {
      window.location.href = href;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to register");

      setRegistered(true);
      setAttendeeCount((prev) => prev + 1);
      toast.success(`You’re registered for ${event.title}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group relative flex w-[285px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl bg-card/80 border border-border/50 shadow-2xs transition-colors duration-200 hover:border-primary/40 hover:shadow-md">
      {/* Decorative top banner */}
      <div className={cn("relative p-3.5 pb-3", config.tint)}>
        <div className="flex items-center justify-between gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", config.pill)}>
            <Icon className="size-3" aria-hidden />
            {event.eventType.toLowerCase().replace(/_/g, " ")}
          </span>
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground backdrop-blur-xs">
            {event.mode === "ONLINE" ? "Online" : event.mode === "HYBRID" ? "Hybrid" : "On campus"}
          </span>
        </div>

        <Link href={href} className="mt-2.5 block">
          <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {event.title}
          </p>
          <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">
            {event.clubName}
          </p>
        </Link>
      </div>

      {/* Card Details & Action Footer */}
      <div className="flex flex-1 flex-col justify-between p-3.5 pt-2.5">
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 font-medium">
              <CalendarDays className="size-3.5 text-muted-foreground/80" aria-hidden />
              {formatDate(event.startDate)}
            </span>
            {event.prizesDescription ? (
              <span className="inline-flex max-w-[140px] items-center gap-1 truncate font-semibold text-warning">
                <Trophy className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{event.prizesDescription}</span>
              </span>
            ) : (
              <span className="font-semibold text-foreground">{event.entryFee || "Free"}</span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="size-3 text-muted-foreground/70" aria-hidden />
            {attendeeCount} joined
          </span>

          {registered ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
              <Check className="size-3.5" aria-hidden /> Joined
            </span>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground shadow-2xs transition-transform hover:bg-primary/90 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Joining…" : isTeam ? "Details" : "Join"}
              <ArrowRight className="size-3" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeedEventSpotlight({ className }: { className?: string }) {
  const { data } = useSWR<{ events: EventItem[] }>("/api/events?limit=6&sort=trending&status=ACTIVE", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const events = data?.events ?? [];
  if (events.length === 0) return null;

  return (
    <section className={cn("py-4", className)} aria-label="Campus Events & Hackathons">
      <div className="mb-3 flex items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-danger/10 text-danger">
            <Sparkles className="size-3.5" aria-hidden />
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-sm font-bold text-foreground">Campus Events &amp; Fests</h3>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
              <span className="size-1.5 rounded-full bg-danger animate-pulse" />
              Live &amp; Upcoming
            </span>
          </div>
        </div>

        <Link
          href="/events"
          className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
        >
          View all <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4">
        {events.map((ev) => (
          <FeedEventCard key={ev.id} event={ev} />
        ))}
      </div>
    </section>
  );
}
