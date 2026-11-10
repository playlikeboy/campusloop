"use client";

import { ExternalLink, MapPin, Video } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCalendarDropdown } from "./add-to-calendar-dropdown";
import { eventModeLabel, eventTypeLabel } from "./event-card";
import { EventDateTile } from "./event-date-tile";

export interface TicketEvent {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  bannerUrl: string | null;
  clubName: string;
  eventType: string;
  mode: string;
  venue: string | null;
  meetingUrl: string | null;
  startDate: string;
  endDate: string;
  isRegistered: boolean;
  status: string;
  userRegistration?: {
    id: string;
    registrationType: "SOLO" | "TEAM";
    teamName: string | null;
    status: "CONFIRMED" | "ATTENDED" | "WAITLISTED" | "CANCELLED";
    createdAt: string;
  } | null;
}

const REG_STATUS: Record<string, { label: string; variant: "verified" | "brand" | "warning" | "neutral" }> = {
  ATTENDED: { label: "Checked in", variant: "verified" },
  CONFIRMED: { label: "Confirmed", variant: "brand" },
  WAITLISTED: { label: "On waitlist", variant: "warning" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function TicketCard({
  event,
  holderName,
  canCancel,
  cancelling,
  onCancel,
}: {
  event: TicketEvent;
  holderName: string;
  canCancel: boolean;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const reg = event.userRegistration;
  const status = REG_STATUS[reg?.status || "CONFIRMED"] ?? REG_STATUS.CONFIRMED;
  const start = new Date(event.startDate);
  const when = `${start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}, ${start.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
  const href = `/events/${event.slug || event.id}`;
  const meetingUrl = event.meetingUrl?.startsWith("http") ? event.meetingUrl : null;

  return (
    <article className="rounded-lg border border-border bg-surface">
      <div className="flex gap-4 p-4">
        <EventDateTile date={event.startDate} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="neutral">{eventTypeLabel(event.eventType)}</Badge>
          </div>
          <Link
            href={href}
            className="block font-display text-lg font-bold leading-snug text-fg hover:text-brand-text"
          >
            {event.title}
          </Link>
          <p className="text-sm tabular-nums text-fg-muted">{when}</p>
          <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {event.venue || eventModeLabel(event.mode)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-dashed border-border-strong px-4 py-3 text-sm">
        <span className="text-fg-muted">
          For <span className="font-semibold text-fg">{holderName}</span>
          {reg?.teamName ? ` · Team ${reg.teamName}` : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        <AddToCalendarDropdown
          variant="button"
          event={{
            id: event.id,
            title: event.title,
            description: event.tagline ?? "",
            venue: event.venue,
            mode: event.mode,
            startDate: event.startDate,
            endDate: event.endDate,
            slug: event.slug,
            clubName: event.clubName,
          }}
        />
        {meetingUrl && (
          <Button asChild variant="outline" size="sm" className="min-h-11">
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
              <Video aria-hidden /> Join online
            </a>
          </Button>
        )}
        <Button asChild variant="ghost" size="sm" className="min-h-11">
          <Link href={href}>
            Event page <ExternalLink aria-hidden />
          </Link>
        </Button>
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto min-h-11 text-danger"
            onClick={onCancel}
            loading={cancelling}
          >
            Cancel registration
          </Button>
        )}
      </div>
    </article>
  );
}
