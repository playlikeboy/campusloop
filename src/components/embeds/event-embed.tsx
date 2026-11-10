"use client";

import { Calendar, Check, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { AddToCalendarDropdown } from "@/components/events/add-to-calendar-dropdown";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface EventEmbedProps {
  eventId: string;
}

interface EventData {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  bannerUrl: string | null;
  clubName: string;
  eventType: string;
  mode: string;
  venue: string | null;
  startDate: string;
  endDate: string;
  isRegistered?: boolean;
  attendeeCount?: number;
  entryFee?: string;
  prizesDescription?: string | null;
}

export function EventEmbed({ eventId }: EventEmbedProps) {
  const { data, isLoading } = useSWR<{ event: EventData }>(
    eventId ? `/api/events/${eventId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const event = data?.event;
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  if (isLoading) {
    return (
      <div className="mt-3 p-3.5 rounded-2xl border border-border bg-surface-muted animate-pulse flex items-center gap-3">
        <div className="size-12 rounded-2xl bg-muted/60" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-muted/60 rounded-md w-40" />
          <div className="h-3 bg-muted/40 rounded-md w-28" />
        </div>
      </div>
    );
  }

  if (!event) return null;

  const userRegistered = isRegistered || event.isRegistered;

  async function handleQuickRegister(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!event || isRegistering || userRegistered) return;

    setIsRegistering(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationType: "SOLO" }),
      });

      const resData = (await res.json()) as { error?: string; pointsEarned?: number };
      if (!res.ok) {
        throw new Error(resData.error || "Couldn't sign you up. Try again.");
      }

      sounds.pop();
      haptics.medium();
      setIsRegistered(true);
      toast.success(
        resData.pointsEarned ? `You're going. +${resData.pointsEarned} Loop Points` : "You're going"
      );
      mutate(`/api/events/${eventId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't sign you up. Try again.");
    } finally {
      setIsRegistering(false);
    }
  }

  const dateStr = new Date(event.startDate).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/events/${event.slug || event.id}`}
      onClick={(e) => e.stopPropagation()}
      className="mt-3 block overflow-hidden rounded-2xl border border-border bg-card hover:bg-muted/20 transition-colors shadow-xs group"
    >
      {event.bannerUrl && (
        <div className="relative aspect-24/10 w-full overflow-hidden bg-muted/30">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="rounded-md bg-black/75 px-2 py-0.5 text-xs font-semibold text-white">
              {event.eventType}
            </span>
            <span className="rounded-md bg-primary/90 px-2 py-0.5 text-xs font-bold text-primary-foreground">
              {event.mode}
            </span>
          </div>
        </div>
      )}

      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-primary">{event.clubName}</span>
          <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <Calendar className="size-3.5 text-muted-foreground" />
            <span>{dateStr}</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm text-foreground group-hover:underline line-clamp-1">
            {event.title}
          </h4>
          {event.tagline && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-medium">{event.tagline}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            {event.venue && (
              <span className="flex items-center gap-1 truncate max-w-[140px]">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{event.venue.split(",")[0]}</span>
              </span>
            )}
            <span>·</span>
            <span>{event.attendeeCount || 0} attending</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
              variant="minimal"
            />

            <Button
              size="sm"
              onClick={handleQuickRegister}
              disabled={isRegistering || userRegistered}
              className={`h-8 px-3.5 text-xs font-bold rounded-full shrink-0 transition-colors cursor-pointer ${
                userRegistered
                  ? "bg-success/15 text-success border border-success/30"
                  : "bg-primary text-primary-foreground hover:opacity-90 shadow-2xs"
              }`}
            >
              {userRegistered ? (
                <>
                  <Check className="size-3 mr-1" />
                  <span>Going</span>
                </>
              ) : (
                <span>I'm going</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
