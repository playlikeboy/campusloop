/* biome-ignore-all lint/suspicious/noExplicitAny: the event API returns an untyped payload */
"use client";

import {
  ArrowLeft,
  Bell,
  BellRing,
  CalendarDays,
  CalendarPlus,
  ExternalLink,
  Settings,
  Share2,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { BrandedQrModal } from "@/components/common/branded-qr-modal";
import { eventModeLabel, eventTypeLabel } from "@/components/events/event-card";
import { GoingSticker } from "@/components/events/event-countdown-tag";
import { EventDateTile } from "@/components/events/event-date-tile";
import {
  EventAbout,
  EventAttendees,
  EventFacts,
  EventHost,
  EventPrizes,
  EventRelated,
} from "@/components/events/event-detail-sections";
import { EventRegisterDialog } from "@/components/events/event-register-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CountdownSticker, LoopPointsSticker } from "@/components/ui/stickers";
import { useProfile } from "@/hooks/use-profile";
import { fetcher } from "@/lib/api";
import { type CalendarEvent, downloadAppleCalendarIcs, openGoogleCalendar } from "@/lib/calendar";
import { haptics } from "@/lib/haptics";

interface EventDetailClientProps {
  eventId: string;
}

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-4" role="status" aria-label="Loading event">
      <Skeleton className="h-11 w-24 rounded-full" />
      <Skeleton className="aspect-[16/9] w-full rounded-lg" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function EventDetailClient({ eventId }: EventDetailClientProps) {
  const router = useRouter();
  const { profile } = useProfile();
  const swrKey = `/api/events/${eventId}`;
  const { data, isLoading, error } = useSWR<{ event: any }>(swrKey, fetcher);
  const event = data?.event;

  const [bannerFailed, setBannerFailed] = useState(false);
  useEffect(() => setBannerFailed(false), [event?.bannerUrl]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isTogglingReminder, setIsTogglingReminder] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const { data: relatedData } = useSWR<{ related: any[] }>(
    event ? `/api/events/${eventId}/related` : null,
    fetcher
  );
  const relatedEvents = relatedData?.related || [];

  if (isLoading) return <DetailSkeleton />;

  if (!event) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-10">
        <EmptyState
          icon={CalendarDays}
          title={error ? "This event didn't load" : "We couldn't find this event"}
          description={
            error ? "Check your connection and try again." : "It may have been removed or the link is wrong."
          }
          action={
            <Button asChild>
              <Link href="/events">See all events</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isOrganizer = Boolean(
    profile &&
      (profile.id === event.organizerProfileId ||
        profile.id === event.organizer?.id ||
        profile.role === "ADMIN")
  );
  const startMs = new Date(event.startDate).getTime();
  const endMs = new Date(event.endDate).getTime();
  const regClosesRaw = event.registrationDeadline ? new Date(event.registrationDeadline).getTime() : Number.NaN;
  const regClosesMs = Number.isFinite(regClosesRaw) ? regClosesRaw : null;
  const goingCount = Number(event.attendeeCount);
  const isLive = now !== null && now >= startMs && now <= endMs;
  const hasEnded = now !== null && now > endMs;
  const posterUrl =
    typeof event.bannerUrl === "string" && event.bannerUrl.startsWith("https://") ? event.bannerUrl : null;
  const showPoster = Boolean(posterUrl && !bannerFailed);
  const externalUrl =
    typeof event.meetingUrl === "string" && event.meetingUrl.startsWith("http") ? event.meetingUrl : null;
  const points = Number(event.loopPointsReward) || 0;

  const calendarEvent: CalendarEvent = {
    id: event.id,
    title: event.title,
    description: event.description,
    venue: event.venue,
    mode: event.mode,
    startDate: event.startDate,
    endDate: event.endDate,
    slug: event.slug,
    clubName: event.clubName,
  };

  async function handleToggleReminder() {
    if (isTogglingReminder) return;
    setIsTogglingReminder(true);
    haptics.light();
    try {
      const res = await fetch(`/api/events/${event.id}/reminder`, { method: "POST" });
      const resData = (await res.json().catch(() => ({}))) as { error?: string; reminderSet?: boolean };
      if (!res.ok) throw new Error(resData.error);
      toast.success(resData.reminderSet ? "We'll remind you before it starts." : "Reminder turned off.");
      void mutate(swrKey);
    } catch {
      toast.error("Couldn't change the reminder. Try again.");
    } finally {
      setIsTogglingReminder(false);
    }
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 pt-3 pb-28 sm:pt-5">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => router.back()} className="-ml-3">
          <ArrowLeft aria-hidden /> Back
        </Button>
        <div className="flex items-center gap-2">
          {isOrganizer && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/manage/${event.slug || event.id}`}>
                <Settings aria-hidden /> Manage
              </Link>
            </Button>
          )}
          <Button
            variant="circleIcon"
            size="icon"
            onClick={() => setShowQrModal(true)}
            aria-label="Share event"
          >
            <Share2 />
          </Button>
        </div>
      </div>

      {showPoster && (
        <div className="mt-3 aspect-[16/9] overflow-hidden rounded-lg bg-surface-muted">
          <img
            src={posterUrl as string}
            alt={`${event.title} poster`}
            className="size-full object-cover"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
          />
        </div>
      )}

      <header className="mt-5 flex items-start gap-4">
        {!showPoster && <EventDateTile date={event.startDate} size="lg" />}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {isLive && <Badge variant="danger">Happening now</Badge>}
            {hasEnded && <Badge variant="neutral">Ended</Badge>}
            <Badge variant="neutral">{eventTypeLabel(event.eventType)}</Badge>
            <Badge variant="outline">{event.entryFee || "Free"}</Badge>
            {Number.isFinite(goingCount) && goingCount > 0 && <GoingSticker count={goingCount} />}
          </div>
          <h1 className="font-display text-3xl font-extrabold text-balance text-fg sm:text-4xl">
            {event.title}
          </h1>
          <p className="text-base text-fg-muted">
            {event.tagline ? `${event.tagline} · ` : ""}
            {event.clubName}
          </p>
        </div>
      </header>

      <div className="mt-5 space-y-3">
        {event.isRegistered ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-verified-subtle p-4">
            <p className="font-semibold text-verified-text">You're going</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/events/my-tickets">
                <Ticket aria-hidden /> See my ticket
              </Link>
            </Button>
          </div>
        ) : !hasEnded ? (
          <div className="flex flex-wrap gap-2">
            {externalUrl ? (
              <Button asChild className="flex-1 sm:flex-none">
                <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                  Apply on the event site <ExternalLink aria-hidden />
                </a>
              </Button>
            ) : null}
            <Button
              variant={externalUrl ? "outline" : "primary"}
              className="flex-1 sm:flex-none"
              onClick={() => {
                haptics.medium();
                setShowRegModal(true);
              }}
            >
              {externalUrl ? "Register on CampusLoop" : "Register"}
            </Button>
            <Button
              variant="outline"
              onClick={handleToggleReminder}
              loading={isTogglingReminder}
              selected={Boolean(event.reminderSet)}
              aria-pressed={Boolean(event.reminderSet)}
            >
              {event.reminderSet ? <BellRing aria-hidden /> : <Bell aria-hidden />}
              {event.reminderSet ? "Reminder on" : "Remind me"}
            </Button>
          </div>
        ) : null}

        {!hasEnded && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            <CalendarPlus className="size-4" aria-hidden />
            <span>Add to calendar:</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => openGoogleCalendar(calendarEvent)}
              className="min-h-11"
            >
              Google
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={() => downloadAppleCalendarIcs(calendarEvent)}
              className="min-h-11"
            >
              Apple (.ics)
            </Button>
          </div>
        )}

        {points > 0 && !event.isRegistered && !hasEnded && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            Register to earn <LoopPointsSticker points={points} size="sm" />
          </p>
        )}
      </div>

      {!isLive && !hasEnded && now !== null && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <CountdownSticker title="Starts in" target={event.startDate} />
          {regClosesMs !== null && regClosesMs > now && regClosesMs < startMs && !event.isRegistered && (
            <CountdownSticker
              title="Registration closes in"
              target={event.registrationDeadline}
              variant="flat"
              doneLabel="Registration closed"
            />
          )}
        </div>
      )}

      <div className="mt-4">
        <EventFacts event={event} />
      </div>
      <EventPrizes event={event} />
      <EventAbout description={event.description} />
      <EventHost event={event} />
      <EventAttendees registrations={event.registrations} />
      <EventRelated related={relatedEvents} />

      <EventRegisterDialog event={event} swrKey={swrKey} open={showRegModal} onOpenChange={setShowRegModal} />

      <BrandedQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={event.title}
        subtitle={`${event.clubName} · ${event.venue || eventModeLabel(event.mode)}`}
        badgeText="Event"
        shortUrl={`https://campusloop.space/e/${event.slug || event.id}`}
        category="event"
      />
    </article>
  );
}
