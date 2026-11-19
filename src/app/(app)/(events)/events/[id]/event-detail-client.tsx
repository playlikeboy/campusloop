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
    <div className="mx-auto w-full max-w-3xl space-y-4 pt-4" role="status" aria-label="Loading event">
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
      <div className="mx-auto w-full max-w-3xl pt-10">
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

  const longRunning = Number.isFinite(endMs - startMs) && endMs - startMs > 3 * 24 * 60 * 60 * 1000;
  // "Live now" only for short events that are running. Month-long challenges are "open".
  const isOpenWindow = isLive && longRunning;
  const isHappening = isLive && !longRunning;
  const startLabel = Number.isFinite(startMs)
    ? new Date(startMs).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
    : "Date to be announced";
  const closesLabel = (ms: number) =>
    new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const regClosed = regClosesMs !== null && now !== null && now > regClosesMs;
  const openUntilMs = regClosesMs !== null && regClosesMs < endMs ? regClosesMs : endMs;

  return (
    <article className="mx-auto w-full max-w-3xl pt-2 pb-24 sm:pt-5 lg:pb-12">
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
        <div className="mt-2 aspect-[16/9] overflow-hidden rounded-lg bg-surface-muted">
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

      <header className="mt-4 space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {isHappening ? (
            <Badge variant="danger" className="h-7">
              Happening now
            </Badge>
          ) : hasEnded ? (
            <Badge variant="neutral" className="h-7">
              Ended
            </Badge>
          ) : (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 text-xs font-semibold text-brand-text">
              <CalendarDays className="size-3.5" aria-hidden />
              {isOpenWindow ? `Open till ${closesLabel(openUntilMs)}` : startLabel}
            </span>
          )}
          <Badge variant="neutral" className="h-7">
            {eventTypeLabel(event.eventType)}
          </Badge>
          <Badge variant="outline" className="h-7 max-w-full shrink" title={event.entryFee || "Free"}>
            <span className="truncate">{event.entryFee || "Free"}</span>
          </Badge>
          {Number.isFinite(goingCount) && goingCount > 0 && <GoingSticker count={goingCount} />}
        </div>
        <h1 className="font-display text-2xl leading-tight font-extrabold text-balance break-words text-fg sm:text-4xl">
          {event.title}
        </h1>
        <p className="text-base text-fg-muted">
          {event.tagline ? `${event.tagline} · ` : ""}
          {event.clubName}
        </p>
        {points > 0 && !hasEnded && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            {event.isRegistered ? "You earn" : "Register to earn"}{" "}
            <LoopPointsSticker points={points} size="sm" />
          </div>
        )}
      </header>

      {!hasEnded && (
        <div
          className={
            "fixed inset-x-0 bottom-[calc(var(--nav-mobile-h)+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface px-4 py-2.5 " +
            "lg:static lg:z-auto lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0"
          }
        >
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            {event.isRegistered ? (
              <>
                <p className="min-w-0 flex-1 truncate font-semibold text-verified-text">You're going</p>
                <Button asChild variant="outline">
                  <Link href="/events/my-tickets">
                    <Ticket aria-hidden /> My ticket
                  </Link>
                </Button>
              </>
            ) : regClosed ? (
              <Button disabled variant="secondary" className="min-w-0 flex-1 lg:flex-none">
                Registration closed
              </Button>
            ) : externalUrl ? (
              <Button asChild className="min-w-0 flex-1 lg:flex-none">
                <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                  Apply on event site <ExternalLink aria-hidden />
                </a>
              </Button>
            ) : (
              <Button
                className="min-w-0 flex-1 lg:flex-none lg:px-8"
                onClick={() => {
                  haptics.medium();
                  setShowRegModal(true);
                }}
              >
                Register
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleReminder}
              loading={isTogglingReminder}
              selected={Boolean(event.reminderSet)}
              aria-pressed={Boolean(event.reminderSet)}
              aria-label={event.reminderSet ? "Reminder on" : "Remind me"}
              title={event.reminderSet ? "Reminder on" : "Remind me"}
            >
              {event.reminderSet ? <BellRing /> : <Bell />}
            </Button>
          </div>
        </div>
      )}

      {!hasEnded && (
        <div className="mt-4 space-y-1">
          {externalUrl && !event.isRegistered && !regClosed && (
            <Button
              variant="link"
              className="min-h-11"
              onClick={() => {
                haptics.medium();
                setShowRegModal(true);
              }}
            >
              Or register on CampusLoop
            </Button>
          )}
          <div className="flex flex-wrap items-center gap-x-3 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarPlus className="size-4" aria-hidden /> Add to calendar:
            </span>
            <Button variant="link" size="sm" onClick={() => openGoogleCalendar(calendarEvent)} className="min-h-11">
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
        </div>
      )}

      {!hasEnded && now !== null && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {!isLive && <CountdownSticker title="Starts in" target={event.startDate} />}
          {regClosesMs !== null &&
            regClosesMs > now &&
            (isLive || regClosesMs < startMs) &&
            !event.isRegistered && (
              <CountdownSticker
                title="Registration closes in"
                target={event.registrationDeadline}
                variant={isLive ? "sticker" : "flat"}
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
