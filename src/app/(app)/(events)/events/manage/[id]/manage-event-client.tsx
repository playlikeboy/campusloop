"use client";

import { ArrowLeft, Calendar, ExternalLink, Link2, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { EVENT_STATUS, type EventStatus } from "@/components/events/event-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { LatestRegistrations, ManageLinks, type ManageRegistration } from "./manage-event-parts";

interface ManageEventClientProps {
  eventId: string;
  initialSlug: string;
  currentProfile: {
    id: string;
    displayName: string;
    username: string;
    role: string;
  };
}

interface ManagedEvent {
  id: string;
  slug: string;
  title: string;
  bannerUrl: string | null;
  clubName: string;
  mode: string;
  venue: string | null;
  startDate: string;
  status: EventStatus;
  maxParticipants: number | null;
  registrations: Array<ManageRegistration & { profileId: string }>;
}

type SettableStatus = "PUBLISHED" | "COMPLETED" | "CANCELLED";

export function ManageEventClient({ eventId, initialSlug }: ManageEventClientProps) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<{ event: ManagedEvent }>(
    `/api/events/${eventId}`,
    fetcher
  );

  const event = data?.event;
  const slug = event?.slug || initialSlug;

  async function handleStatusChange(next: SettableStatus) {
    if (!event || next === event.status) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success(`Marked as ${EVENT_STATUS[next].label.toLowerCase()}.`);
    } catch {
      toast.error("Couldn't change the status. Check your connection and try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleDeleteEvent() {
    if (!event) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Event deleted.");
      router.push("/events/dashboard");
    } catch {
      toast.error("Couldn't delete the event. Check your connection and try again.");
      setIsDeleting(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${slug}`);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link. Copy it from the event page instead.");
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <EmptyState
          title="This event didn't load"
          description="It may have been deleted, or your connection dropped."
          action={
            <Button asChild>
              <Link href="/events/dashboard">Back to my events</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const count = event.registrations.length;
  const checkedIn = event.registrations.filter((r) => r.status === "ATTENDED").length;
  const status = EVENT_STATUS[event.status] ?? EVENT_STATUS.DRAFT;
  const startLabel = new Date(event.startDate).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <header className="flex items-start gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back to my events">
          <Link href="/events/dashboard">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg-muted">{event.clubName}</p>
          <h1 className="text-2xl font-bold text-balance text-fg">{event.title}</h1>
        </div>
      </header>

      <section
        aria-label="Event summary"
        className="space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-5"
      >
        <div className="flex gap-4">
          {event.bannerUrl && (
            <img
              src={event.bannerUrl}
              alt=""
              className="size-16 shrink-0 rounded-md border border-border object-cover sm:size-20"
            />
          )}
          <div className="min-w-0 space-y-1.5 text-sm text-fg-muted">
            <Badge variant={status.variant}>{status.label}</Badge>
            <p className="flex items-center gap-1.5">
              <Calendar aria-hidden="true" className="size-4 shrink-0" />
              {startLabel}
            </p>
            {event.venue && (
              <p className="flex min-w-0 items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{event.venue}</span>
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-fg">
          <span className="font-semibold tabular-nums">{count}</span>
          {event.maxParticipants ? ` of ${event.maxParticipants} spots taken` : " signed up"}
          {" · "}
          <span className="font-semibold tabular-nums">{checkedIn}</span> checked in
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyLink}>
            <Link2 aria-hidden="true" />
            Copy link
          </Button>
          <Button asChild variant="outline">
            <Link href={`/events/${slug}`} target="_blank">
              Open event page
              <ExternalLink aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {event.status !== "DRAFT" && (
          <SegmentedControl<SettableStatus>
            aria-label="Event status"
            fullWidth
            disabled={isUpdatingStatus}
            value={event.status as SettableStatus}
            onChange={handleStatusChange}
            options={[
              { value: "PUBLISHED", label: "Live" },
              { value: "COMPLETED", label: "Finished" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
        )}
        {event.status === "DRAFT" && (
          <Button loading={isUpdatingStatus} onClick={() => handleStatusChange("PUBLISHED")}>
            Publish event
          </Button>
        )}
      </section>

      <ManageLinks slug={slug} />
      <LatestRegistrations slug={slug} registrations={event.registrations} />

      <section aria-labelledby="delete-title" className="space-y-3 rounded-lg border border-border p-4">
        <div>
          <h2 id="delete-title" className="font-semibold text-fg">
            Delete event
          </h2>
          <p className="text-sm text-fg-muted">
            This removes the event and every sign-up. You can't undo it.
          </p>
        </div>
        <Button variant="danger" onClick={() => setConfirmDelete(true)} loading={isDeleting}>
          <Trash2 aria-hidden="true" />
          Delete event
        </Button>
      </section>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete this event?"
        description="Every sign-up goes too. You can't undo this."
        confirmText="Delete event"
        cancelText="Keep it"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteEvent}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
