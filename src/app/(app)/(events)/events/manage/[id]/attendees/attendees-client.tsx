"use client";

import { Download, Search, UserCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ManageHeader } from "@/components/events/manage-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { formatTimeAgo, initialOf } from "@/lib/utils";
import { type AttendeeRegistration, downloadAttendeesCsv } from "./attendees-csv";

interface AttendeesClientProps {
  eventId: string;
  initialSlug: string;
  eventTitle: string;
}

type Filter = "ALL" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
type NextStatus = "CONFIRMED" | "ATTENDED" | "CANCELLED";

const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  ATTENDED: { label: "Checked in", variant: "verified" },
  CONFIRMED: { label: "Going", variant: "neutral" },
  WAITLISTED: { label: "Waitlist", variant: "warning" },
  CANCELLED: { label: "Removed", variant: "danger" },
};

export function AttendeesClient({ eventId, initialSlug, eventTitle }: AttendeesClientProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<{
    event: { slug: string; registrations: AttendeeRegistration[] };
  }>(`/api/events/${eventId}`, fetcher);

  const registrations = data?.event?.registrations || [];
  const slug = data?.event?.slug || initialSlug;
  const q = search.trim().toLowerCase();
  const shown = registrations.filter((r) => {
    if (filter !== "ALL" && r.status !== filter) return false;
    if (!q) return true;
    return [
      r.profile?.displayName,
      r.profile?.username,
      r.profile?.email,
      r.teamName,
      r.profile?.institution?.name,
    ].some((v) => v?.toLowerCase().includes(q));
  });
  const checkedIn = registrations.filter((r) => r.status === "ATTENDED").length;

  async function updateStatus(regId: string, status: NextStatus) {
    setBusyId(regId);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success(
        status === "CANCELLED" ? "Removed." : status === "ATTENDED" ? "Checked in." : "Check-in undone."
      );
    } catch {
      toast.error("That didn't save. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  function exportCsv() {
    if (registrations.length === 0) {
      toast.error("No one to export yet.");
      return;
    }
    downloadAttendeesCsv(registrations, eventTitle);
    toast.success("CSV downloaded.");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
      <ManageHeader
        slug={slug}
        title="Attendees"
        eventTitle={eventTitle}
        action={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download aria-hidden="true" />
              CSV
            </Button>
            <Button asChild>
              <Link href={`/events/manage/${slug}/check-in`}>
                <UserCheck aria-hidden="true" />
                Check-in
              </Link>
            </Button>
          </>
        }
      />

      <p className="text-sm text-fg">
        <span className="font-semibold tabular-nums">{registrations.length}</span> signed up ·{" "}
        <span className="font-semibold tabular-nums">{checkedIn}</span> checked in
      </p>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
        />
        <Input
          type="search"
          aria-label="Search attendees"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, @username, email, team or college"
          className="pl-10"
        />
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <SegmentedControl<Filter>
          aria-label="Filter by status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: "All" },
            { value: "CONFIRMED", label: "Going" },
            { value: "ATTENDED", label: "Checked in" },
            { value: "CANCELLED", label: "Removed" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Attendees didn't load"
          description="Check your connection and try again."
          action={<Button onClick={() => mutate()}>Try again</Button>}
        />
      ) : shown.length === 0 ? (
        <EmptyState
          size="compact"
          title={registrations.length === 0 ? "No sign-ups yet" : "No one matches"}
          description={
            registrations.length === 0
              ? "Share the event link to get people in."
              : "Try another name or filter."
          }
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {shown.map((reg) => (
            <AttendeeRow
              key={reg.id}
              reg={reg}
              busy={busyId === reg.id}
              onStatus={(s) => updateStatus(reg.id, s)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AttendeeRow({
  reg,
  busy,
  onStatus,
}: {
  reg: AttendeeRegistration;
  busy: boolean;
  onStatus: (status: NextStatus) => void;
}) {
  const name = reg.profile?.displayName || "Student";
  const status = STATUS[reg.status] ?? { label: reg.status, variant: "neutral" as const };
  const study = [
    reg.profile?.course,
    reg.profile?.branch,
    reg.profile?.year ? `Year ${reg.profile.year}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg">
            {reg.profile?.avatarUrl && <AvatarImage src={reg.profile.avatarUrl} alt="" />}
            <AvatarFallback>{initialOf(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-xs text-fg-muted">
            <p className="truncate text-sm font-semibold text-fg">{name}</p>
            <p className="truncate">
              {reg.profile?.username ? `@${reg.profile.username}` : "No username"}
              {reg.profile?.email && ` · ${reg.profile.email}`}
            </p>
            {reg.profile?.institution?.name && <p className="truncate">{reg.profile.institution.name}</p>}
            {study && <p className="truncate">{study}</p>}
          </div>
        </div>
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
      </div>
      {(reg.teamName || reg.contactPhone) && (
        <p className="text-xs text-fg-muted">
          {reg.teamName && <span className="font-semibold text-fg">Team {reg.teamName}</span>}
          {reg.teamName && reg.contactPhone && " · "}
          {reg.contactPhone}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-fg-subtle">Signed up {formatTimeAgo(new Date(reg.createdAt))}</span>
        <div className="flex w-full gap-2 *:flex-1 sm:w-auto sm:*:flex-none">
          {reg.status !== "CANCELLED" && (
            <Button variant="ghost" disabled={busy} onClick={() => onStatus("CANCELLED")}>
              Remove
            </Button>
          )}
          {reg.status === "ATTENDED" ? (
            <Button variant="outline" loading={busy} onClick={() => onStatus("CONFIRMED")}>
              Undo check-in
            </Button>
          ) : (
            <Button loading={busy} onClick={() => onStatus("ATTENDED")}>
              Check in
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
