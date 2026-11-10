"use client";

import { Cake, Calendar, Globe, School, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { BirthdayCard, type BirthdayStudent } from "./birthday-card";
import { BirthdayPrivacyCard } from "./birthday-privacy-card";

interface BirthdayResponse {
  today: BirthdayStudent[];
  upcoming: BirthdayStudent[];
  byMonth?: BirthdayStudent[];
  currentUserDob?: string | null;
  currentUserIsPrivate?: boolean;
}

type Scope = "CAMPUS" | "GLOBAL";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function matches(s: BirthdayStudent, q: string) {
  if (!q) return true;
  return s.displayName.toLowerCase().includes(q) || s.username.toLowerCase().includes(q);
}

function List({ people, isToday = false }: { people: BirthdayStudent[]; isToday?: boolean }) {
  return (
    <ul className="space-y-2">
      {people.map((s) => (
        <BirthdayCard key={s.id} student={s} isToday={isToday} />
      ))}
    </ul>
  );
}

/** Today's birthdays, the next few weeks, and a month filter. */
export function BirthdaysClient() {
  const [scope, setScope] = useState<Scope>("CAMPUS");
  const [month, setMonth] = useState("");
  const [query, setQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const params = new URLSearchParams({ scope });
  if (month) params.set("month", month);
  const { data, error, isLoading, mutate } = useSWR<BirthdayResponse>(`/api/birthdays?${params}`, fetcher, {
    revalidateOnFocus: true,
  });

  async function togglePrivacy() {
    if (!data) return;
    setIsSaving(true);
    const next = !data.currentUserIsPrivate;
    mutate((prev) => (prev ? { ...prev, currentUserIsPrivate: next } : prev), false);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDobPrivate: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "Your birthday is hidden" : "Your birthday is visible");
      mutate();
    } catch {
      mutate((prev) => (prev ? { ...prev, currentUserIsPrivate: !next } : prev), false);
      toast.error("Couldn't save that. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const q = query.trim().toLowerCase();
  const today = (data?.today ?? []).filter((s) => matches(s, q));
  const upcoming = (data?.upcoming ?? []).filter((s) => matches(s, q));
  const byMonth = (data?.byMonth ?? []).filter((s) => matches(s, q));
  const monthName = month ? MONTHS[Number(month) - 1] : "";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 pt-4 pb-28">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-fg">Birthdays</h1>
        <SegmentedControl<Scope>
          size="sm"
          value={scope}
          onChange={setScope}
          options={[
            { value: "CAMPUS", label: "My college", icon: <School aria-hidden="true" className="size-4" /> },
            { value: "GLOBAL", label: "All India", icon: <Globe aria-hidden="true" className="size-4" /> },
          ]}
        />
      </header>

      {data && (
        <BirthdayPrivacyCard
          dob={data.currentUserDob}
          isPrivate={data.currentUserIsPrivate}
          isSaving={isSaving}
          onToggle={togglePrivacy}
        />
      )}

      <div className="space-y-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
          />
          <Input
            type="search"
            aria-label="Search by name or username"
            placeholder="Search by name or @username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Filter by month">
          <Chip size="sm" selected={!month} onSelectedChange={() => setMonth("")} className="shrink-0">
            Next 60 days
          </Chip>
          {MONTHS.map((label, i) => {
            const value = String(i + 1);
            return (
              <Chip
                key={value}
                size="sm"
                selected={month === value}
                onSelectedChange={() => setMonth(value)}
                className="shrink-0"
              >
                {label}
              </Chip>
            );
          })}
        </div>
      </div>

      {error ? (
        <EmptyState
          icon={Cake}
          title="Couldn't load birthdays"
          description="Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => mutate()}>
              Try again
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {["a", "b", "c", "d"].map((k) => (
            <Skeleton key={k} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : month ? (
        <section className="space-y-3">
          <h2 className="text-base text-fg">Born in {monthName}</h2>
          {byMonth.length > 0 ? (
            <List people={byMonth} />
          ) : (
            <EmptyState size="compact" icon={Calendar} title={`No birthdays in ${monthName}`} />
          )}
        </section>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-base text-fg">Today</h2>
            {today.length > 0 ? (
              <List people={today} isToday />
            ) : (
              <EmptyState
                size="compact"
                icon={Cake}
                title="No birthdays today"
                description={scope === "CAMPUS" ? "Try All India to see more people." : undefined}
              />
            )}
          </section>
          <section className="space-y-3">
            <h2 className="text-base text-fg">Coming up</h2>
            {upcoming.length > 0 ? (
              <List people={upcoming} />
            ) : (
              <EmptyState size="compact" icon={Calendar} title="No birthdays in the next 60 days" />
            )}
          </section>
        </>
      )}
    </div>
  );
}
