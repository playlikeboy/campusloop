"use client";

import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { ManageHeader } from "@/components/events/manage-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";

interface RegistrationItem {
  id: string;
  registrationType: "SOLO" | "TEAM";
  status: "CONFIRMED" | "ATTENDED" | "WAITLISTED" | "CANCELLED";
  profile?: { year: number | null; institution?: { name: string } | null } | null;
}

interface AnalyticsClientProps {
  eventId: string;
  initialSlug: string;
  eventTitle: string;
}

interface Row {
  label: string;
  count: number;
}

const YEAR_LABELS = ["1st year", "2nd year", "3rd year", "4th year"];

function BreakdownList({ title, rows, total }: { title: string; rows: Row[]; total: number }) {
  return (
    <section
      aria-labelledby={`${title}-title`}
      className="space-y-3 rounded-lg border border-border bg-surface p-4 sm:p-5"
    >
      <h2 id={`${title}-title`} className="text-lg font-bold text-fg">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-fg-muted">No data yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const percent = total > 0 ? Math.round((row.count / total) * 100) : 0;
            return (
              <li key={row.label} className="space-y-1">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate text-fg">{row.label}</span>
                  <span className="shrink-0 text-fg-muted tabular-nums">
                    {row.count} ({percent}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-poll-track" aria-hidden="true">
                  <div className="h-full rounded-full bg-poll-fill-chosen" style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function AnalyticsClient({ eventId, initialSlug, eventTitle }: AnalyticsClientProps) {
  const { data, error, isLoading, mutate } = useSWR<{
    event: { slug: string; maxParticipants: number | null; registrations: RegistrationItem[] };
  }>(`/api/events/${eventId}`, fetcher);

  const registrations = useMemo(() => data?.event?.registrations ?? [], [data]);
  const slug = data?.event?.slug || initialSlug;
  const max = data?.event?.maxParticipants;
  const total = registrations.length;
  const attended = registrations.filter((r) => r.status === "ATTENDED").length;

  const { formats, years, colleges } = useMemo(() => {
    const solo = registrations.filter((r) => r.registrationType === "SOLO").length;
    const yearCounts = [0, 0, 0, 0, 0];
    const collegeMap = new Map<string, number>();
    for (const r of registrations) {
      const y = r.profile?.year;
      yearCounts[y && y >= 1 && y <= 4 ? y - 1 : 4]++;
      const name = r.profile?.institution?.name || "College not set";
      collegeMap.set(name, (collegeMap.get(name) || 0) + 1);
    }
    return {
      formats: [
        { label: "Solo", count: solo },
        { label: "Teams", count: registrations.length - solo },
      ],
      years: [...YEAR_LABELS, "Other or PG"].map((label, i) => ({ label, count: yearCounts[i] })),
      colleges: [...collegeMap.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }, [registrations]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
      <ManageHeader
        slug={slug}
        title="Analytics"
        eventTitle={eventTitle}
        action={
          <Button asChild variant="outline">
            <Link href={`/events/manage/${slug}/attendees`}>Attendees</Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : error ? (
        <EmptyState
          title="Analytics didn't load"
          description="Check your connection and try again."
          action={<Button onClick={() => mutate()}>Try again</Button>}
        />
      ) : total === 0 ? (
        <EmptyState title="No sign-ups yet" description="Numbers show up here once people sign up." />
      ) : (
        <>
          <p className="text-sm text-fg">
            <span className="font-semibold tabular-nums">{total}</span>
            {max ? ` of ${max} spots taken` : " signed up"} ·{" "}
            <span className="font-semibold tabular-nums">{attended}</span> checked in (
            {Math.round((attended / total) * 100)}%)
          </p>
          <BreakdownList title="Solo or team" rows={formats} total={total} />
          <BreakdownList title="Year of study" rows={years} total={total} />
          <BreakdownList title="Top colleges" rows={colleges} total={total} />
        </>
      )}
    </div>
  );
}
