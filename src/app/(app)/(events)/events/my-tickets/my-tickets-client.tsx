"use client";

import { ArrowLeft, LayoutList, Ticket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { TicketCard, type TicketEvent } from "@/components/events/ticket-card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";

export function MyTicketsClient({
  profile,
}: {
  profile: {
    id: string;
    displayName: string;
    username: string;
    institution?: { name: string } | null;
  };
}) {
  const [filter, setFilter] = useState<"UPCOMING" | "PAST">("UPCOMING");
  const [cancelTarget, setCancelTarget] = useState<TicketEvent | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<{ events: TicketEvent[] }>(
    "/api/events?scope=REGISTERED",
    fetcher
  );

  const events = data?.events || [];
  const [now] = useState(() => Date.now());
  const upcoming = events.filter((ev) => new Date(ev.endDate).getTime() >= now);
  const past = events.filter((ev) => new Date(ev.endDate).getTime() < now);
  const shown = filter === "UPCOMING" ? upcoming : past;

  async function cancelRegistration(ev: TicketEvent) {
    setCancellingId(ev.id);
    try {
      const res = await fetch(`/api/events/${ev.id}/register`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success("Registration cancelled.");
    } catch {
      toast.error("Couldn't cancel. Check your connection and try again.");
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 pt-4 pb-12 sm:px-0 sm:pt-6">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Button asChild variant="ghost" className="-ml-3">
            <Link href="/events">
              <ArrowLeft aria-hidden /> Events
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/events/dashboard">
              <LayoutList aria-hidden /> Events I host
            </Link>
          </Button>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-fg">My tickets</h1>
      </header>

      <SegmentedControl
        fullWidth
        aria-label="Show"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "UPCOMING", label: `Upcoming (${upcoming.length})` },
          { value: "PAST", label: `Past (${past.length})` },
        ]}
      />

      {error && !events.length ? (
        <EmptyState
          bordered
          size="compact"
          icon={Ticket}
          title="Your tickets didn't load"
          description="Check your connection and try again."
          action={
            <Button variant="secondary" onClick={() => void mutate()}>
              Try again
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="space-y-3" role="status" aria-label="Loading tickets">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : shown.length > 0 ? (
        <div className="space-y-3">
          {shown.map((ev) => (
            <TicketCard
              key={ev.id}
              event={ev}
              holderName={profile.displayName}
              canCancel={filter === "UPCOMING"}
              cancelling={cancellingId === ev.id}
              onCancel={() => setCancelTarget(ev)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          bordered
          size="compact"
          icon={Ticket}
          title={filter === "UPCOMING" ? "No upcoming tickets" : "No past tickets"}
          description="Register for an event and your ticket shows up here."
          action={
            <Button asChild>
              <Link href="/events">Find events</Link>
            </Button>
          }
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="Cancel your registration?"
        description={cancelTarget ? `You'll lose your spot at ${cancelTarget.title}.` : undefined}
        confirmText="Cancel registration"
        cancelText="Keep it"
        variant="danger"
        isLoading={Boolean(cancellingId)}
        onConfirm={() => (cancelTarget ? cancelRegistration(cancelTarget) : undefined)}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
