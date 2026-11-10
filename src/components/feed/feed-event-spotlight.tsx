"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  Dumbbell,
  GraduationCap,
  Palette,
  Rocket,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
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
      tint: "bg-surface-muted",
      accent: "text-fg-muted",
      pill: "bg-bg text-fg-muted",
      Icon: Rocket,
    };
  }
  if (["CULTURAL", "FEST"].includes(type)) {
    return {
      tint: "bg-surface-muted",
      accent: "text-fg-muted",
      pill: "bg-bg text-fg-muted",
      Icon: Palette,
    };
  }
  if (["COMPETITION", "CONTEST"].includes(type)) {
    return {
      tint: "bg-surface-muted",
      accent: "text-fg-muted",
      pill: "bg-bg text-fg-muted",
      Icon: Trophy,
    };
  }
  if (type === "WORKSHOP") {
    return {
      tint: "bg-surface-muted",
      accent: "text-fg-muted",
      pill: "bg-bg text-fg-muted",
      Icon: Wrench,
    };
  }
  if (type === "SPORTS") {
    return {
      tint: "bg-surface-muted",
      accent: "text-fg-muted",
      pill: "bg-bg text-fg-muted",
      Icon: Dumbbell,
    };
  }
  if (["SCHOLARSHIP", "FELLOWSHIP"].includes(type)) {
    return {
      tint: "bg-surface-muted",
      accent: "text-fg-muted",
      pill: "bg-bg text-fg-muted",
      Icon: GraduationCap,
    };
  }
  return {
    tint: "bg-surface-muted",
    accent: "text-fg-muted",
    pill: "bg-bg text-fg-muted",
    Icon: CalendarDays,
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
      if (!res.ok) throw new Error(data.error || "Couldn't sign you up. Try again.");

      setRegistered(true);
      setAttendeeCount((prev) => prev + 1);
      toast.success(`You're going to ${event.title}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't sign you up. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group relative flex w-[285px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-lg bg-surface border border-border transition-ui hover:border-border-strong">
      {/* Title block */}
      <div className={cn("relative p-3.5 pb-3", config.tint)}>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
              config.pill
            )}
          >
            <Icon className="size-3" aria-hidden />
            {event.eventType.toLowerCase().replace(/_/g, " ")}
          </span>
          <span className="rounded-full bg-bg px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {event.mode === "ONLINE" ? "Online" : event.mode === "HYBRID" ? "Hybrid" : "On campus"}
          </span>
        </div>

        <Link href={href} className="mt-2.5 block">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-fg transition-ui group-hover:text-brand-text">
            {event.title}
          </p>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{event.clubName}</p>
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
              <span className="inline-flex max-w-[140px] items-center gap-1 truncate font-semibold text-fg">
                <Trophy className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{event.prizesDescription}</span>
              </span>
            ) : (
              <span className="font-semibold text-foreground">{event.entryFee || "Free"}</span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
          <span className="inline-flex items-center gap-1 text-xs text-fg-muted tabular-nums">
            <Users className="size-3.5" aria-hidden />
            {attendeeCount} going
          </span>

          {registered ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-3 py-1 text-xs font-semibold text-success">
              <Check className="size-3.5" aria-hidden /> Going
            </span>
          ) : (
            <Button
              size="xs"
              onClick={handleJoin}
              loading={loading}
              className="relative after:absolute after:-inset-2 after:content-['']"
            >
              {isTeam ? "See details" : "I'm going"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeedEventSpotlight({ className }: { className?: string }) {
  const { data } = useSWR<{ events: EventItem[] }>(
    "/api/events?limit=6&sort=trending&status=ACTIVE",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  const events = data?.events ?? [];
  if (events.length === 0) return null;

  return (
    <section className={cn("py-4", className)} aria-labelledby="feed-events-title">
      <div className="mb-3 flex items-center justify-between px-4">
        <h3 id="feed-events-title" className="truncate text-base">
          Upcoming events
        </h3>

        <Link
          href="/events"
          className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-semibold text-brand-text hover:underline underline-offset-4"
        >
          See all <ArrowRight className="size-4" aria-hidden />
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
