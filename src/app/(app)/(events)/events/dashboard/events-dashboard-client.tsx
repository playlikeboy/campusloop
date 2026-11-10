"use client";

import { Calendar, CalendarPlus, MapPin, Plus, Ticket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { EVENT_STATUS, type EventStatus } from "@/components/events/event-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";

interface HostedEvent {
  id: string;
  slug: string;
  title: string;
  bannerUrl: string | null;
  clubName: string;
  venue: string | null;
  startDate: string;
  status: EventStatus;
  attendeeCount: number;
  attendedCount: number;
  maxParticipants: number | null;
}

type Filter = "ALL" | "PUBLISHED" | "COMPLETED" | "DRAFT";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PUBLISHED", label: "Live" },
  { value: "COMPLETED", label: "Past" },
  { value: "DRAFT", label: "Drafts" },
];

export function EventsDashboardClient(_props: {
  profile: { id: string; displayName: string; username: string; institution?: { name: string } | null };
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data, error, isLoading, mutate } = useSWR<{ events: HostedEvent[] }>(
    "/api/events?scope=HOSTED",
    fetcher
  );
  const events = data?.events ?? [];
  const shown = filter === "ALL" ? events : events.filter((ev) => ev.status === filter);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-fg">My events</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/events/my-tickets">
              <Ticket aria-hidden="true" />
              My tickets
            </Link>
          </Button>
          <Button asChild>
            <Link href="/events/new">
              <Plus aria-hidden="true" />
              Host an event
            </Link>
          </Button>
        </div>
      </header>

      <div className="overflow-x-auto no-scrollbar">
        <SegmentedControl aria-label="Filter events" value={filter} onChange={setFilter} options={FILTERS} />
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Your events didn't load"
          description="Check your connection and try again."
          action={<Button onClick={() => mutate()}>Try again</Button>}
        />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title={filter === "ALL" ? "You haven't hosted anything yet" : "Nothing here"}
          description={filter === "ALL" ? "Events you host show up here." : "Try another filter."}
          action={
            filter === "ALL" ? (
              <Button asChild>
                <Link href="/events/new">Host an event</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((ev) => (
            <HostedEventRow key={ev.id} event={ev} />
          ))}
        </ul>
      )}
    </div>
  );
}

function HostedEventRow({ event }: { event: HostedEvent }) {
  const slug = event.slug || event.id;
  const status = EVENT_STATUS[event.status] ?? EVENT_STATUS.DRAFT;
  const date = new Date(event.startDate).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li>
      <Link
        href={`/events/manage/${slug}`}
        className="flex gap-3 rounded-lg border border-border bg-surface p-4 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt=""
            className="size-14 shrink-0 rounded-md border border-border object-cover"
          />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-surface-muted">
            <Calendar aria-hidden="true" className="size-6 text-fg-subtle" />
          </span>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="truncate text-xs text-fg-muted">{event.clubName}</span>
          </div>
          <h2 className="truncate text-base font-bold text-fg">{event.title}</h2>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
            <span className="flex items-center gap-1">
              <Calendar aria-hidden="true" className="size-3.5" />
              {date}
            </span>
            {event.venue && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="truncate">{event.venue}</span>
              </span>
            )}
            <span className="tabular-nums">
              {event.attendeeCount}
              {event.maxParticipants ? ` / ${event.maxParticipants}` : ""} signed up
            </span>
          </p>
        </div>
      </Link>
    </li>
  );
}
