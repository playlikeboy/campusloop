"use client";

import { Search, UserCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ManageHeader } from "@/components/events/manage-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { initialOf } from "@/lib/utils";

interface RegistrationItem {
  id: string;
  teamName: string | null;
  contactPhone: string | null;
  status: "CONFIRMED" | "ATTENDED" | "WAITLISTED" | "CANCELLED";
  profile?: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
    institution?: { name: string } | null;
  } | null;
}

interface CheckInClientProps {
  eventId: string;
  initialSlug: string;
  eventTitle: string;
}

type View = "PENDING" | "CHECKED_IN";

function matches(reg: RegistrationItem, q: string) {
  if (!q) return true;
  return [reg.profile?.displayName, reg.profile?.username, reg.id, reg.teamName, reg.contactPhone].some((v) =>
    v?.toLowerCase().includes(q)
  );
}

export function CheckInClient({ eventId, initialSlug, eventTitle }: CheckInClientProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<{
    event: { slug: string; registrations: RegistrationItem[] };
  }>(`/api/events/${eventId}`, fetcher);

  const registrations = data?.event?.registrations || [];
  const slug = data?.event?.slug || initialSlug;
  const pending = registrations.filter((r) => r.status === "CONFIRMED");
  const attended = registrations.filter((r) => r.status === "ATTENDED");
  const q = search.trim().toLowerCase();
  const shown = (view === "PENDING" ? pending : attended).filter((r) => matches(r, q));

  async function setStatus(regId: string, status: "ATTENDED" | "CONFIRMED") {
    setBusyId(regId);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      if (status === "ATTENDED") {
        sounds.pop();
        haptics.success();
      }
      await mutate();
      toast.success(status === "ATTENDED" ? "Checked in." : "Check-in undone.");
    } catch {
      toast.error("That didn't save. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6">
      <ManageHeader
        slug={slug}
        title="Check-in"
        eventTitle={eventTitle}
        action={
          <Button asChild variant="outline">
            <Link href={`/events/manage/${slug}/attendees`}>Everyone</Link>
          </Button>
        }
      />

      <p className="text-sm text-fg" aria-live="polite">
        <span className="font-semibold tabular-nums">{attended.length}</span> of{" "}
        <span className="tabular-nums">{registrations.length}</span> checked in
      </p>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
        />
        <Input
          type="search"
          aria-label="Search people"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, @username, phone or ticket ID"
          className="pl-10"
        />
      </div>

      <SegmentedControl<View>
        aria-label="Show"
        fullWidth
        value={view}
        onChange={setView}
        options={[
          { value: "PENDING", label: `Not in yet (${pending.length})` },
          { value: "CHECKED_IN", label: `Checked in (${attended.length})` },
        ]}
      />

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="The list didn't load"
          description="Check your connection and try again."
          action={<Button onClick={() => mutate()}>Try again</Button>}
        />
      ) : shown.length === 0 ? (
        <EmptyState
          size="compact"
          title={
            q
              ? "No one matches that search"
              : view === "PENDING"
                ? "Everyone is checked in"
                : "No one checked in yet"
          }
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {shown.map((reg) => {
            const name = reg.profile?.displayName || "Student";
            return (
              <li key={reg.id} className="flex items-center justify-between gap-3 p-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="lg">
                    {reg.profile?.avatarUrl && <AvatarImage src={reg.profile.avatarUrl} alt="" />}
                    <AvatarFallback>{initialOf(name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg">{name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {reg.profile?.username ? `@${reg.profile.username}` : "No username"}
                      {reg.teamName && ` · Team ${reg.teamName}`}
                    </p>
                    <p className="truncate font-mono text-xs text-fg-subtle">Ticket {reg.id.slice(0, 8)}</p>
                  </div>
                </div>
                {view === "PENDING" ? (
                  <Button
                    className="shrink-0"
                    loading={busyId === reg.id}
                    onClick={() => setStatus(reg.id, "ATTENDED")}
                  >
                    {busyId !== reg.id && <UserCheck aria-hidden="true" />}
                    Check in
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="shrink-0"
                    loading={busyId === reg.id}
                    onClick={() => setStatus(reg.id, "CONFIRMED")}
                  >
                    Undo
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
