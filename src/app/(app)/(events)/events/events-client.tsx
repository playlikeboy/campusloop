"use client";

import { ArrowLeft, CalendarDays, History, Plus, Search, SlidersHorizontal, Ticket, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { EventCard, EventCardSkeleton, type EventItem, isEventClosed } from "@/components/events/event-card";
import {
  countActiveFilters,
  DEFAULT_EVENT_FILTERS,
  type EventFilters,
  EventFiltersSheet,
} from "@/components/events/event-filters-sheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { fetcher } from "@/lib/api";

type ActiveTab = "ALL" | "CLOSING_SOON" | "REGISTERED";
type EventsClientProps = {
  initialCategory?: string;
  initialStatus?: "ACTIVE" | "CLOSED";
  title?: string;
};

const CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "hackathons", label: "Hackathons" },
  { id: "fests", label: "Fests" },
  { id: "workshops", label: "Workshops" },
  { id: "competitions", label: "Competitions" },
  { id: "contests", label: "Contests" },
  { id: "seminars", label: "Talks" },
  { id: "meetups", label: "Meetups" },
  { id: "gaming", label: "Gaming" },
  { id: "internships", label: "Internships" },
  { id: "scholarships", label: "Scholarships" },
  { id: "fellowships", label: "Fellowships" },
  { id: "grants", label: "Grants" },
  { id: "jobs", label: "Jobs" },
];

const TABS: { value: ActiveTab; label: string }[] = [
  { value: "ALL", label: "Upcoming" },
  { value: "CLOSING_SOON", label: "Closing soon" },
  { value: "REGISTERED", label: "Going" },
];

export function EventsClient({
  initialCategory = "ALL",
  initialStatus = "ACTIVE",
  title,
}: EventsClientProps) {
  const isArchive = initialStatus === "CLOSED";
  const [activeTab, setActiveTab] = useState<ActiveTab>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_EVENT_FILTERS);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 260);
    return () => window.clearTimeout(timer);
  }, [search]);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "ALL") params.set("category", activeCategory);
    const effectiveScope = activeTab === "REGISTERED" ? "REGISTERED" : filters.scope;
    if (effectiveScope !== "ALL") params.set("scope", effectiveScope);
    if (isArchive) params.set("status", "CLOSED");
    else if (activeTab === "CLOSING_SOON") params.set("status", "CLOSING_SOON");
    if (filters.mode !== "ALL") params.set("mode", filters.mode);
    if (filters.fee !== "ALL") params.set("fee", filters.fee);
    if (filters.participation !== "ALL") params.set("participationType", filters.participation);
    if (filters.hasPrizes) params.set("hasPrizes", "true");
    if (filters.sort !== "trending") params.set("sort", filters.sort);
    if (debouncedSearch) params.set("q", debouncedSearch);
    return `/api/events?${params.toString()}`;
  }, [activeCategory, activeTab, filters, isArchive, debouncedSearch]);

  const { data, error, isLoading, mutate } = useSWR<{ events?: EventItem[] } | EventItem[]>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 8000,
  });

  const rawEvents = useMemo(() => {
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.events) ? data.events : [];
  }, [data]);

  const visibleEvents = useMemo(() => {
    if (isArchive) return rawEvents.filter((event) => isEventClosed(event));
    if (activeTab === "REGISTERED") return rawEvents;
    return rawEvents.filter((event) => !isEventClosed(event));
  }, [rawEvents, isArchive, activeTab]);

  const activeFilterCount = countActiveFilters(filters);
  const filterActive =
    search.trim().length > 0 ||
    activeCategory !== initialCategory ||
    activeFilterCount > 0 ||
    activeTab !== "ALL";

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setActiveCategory(initialCategory);
    setFilters(DEFAULT_EVENT_FILTERS);
    setActiveTab("ALL");
  }

  const categoryLabel = CATEGORIES.find((category) => category.id === activeCategory)?.label;
  const pageTitle = isArchive
    ? title || "Past events"
    : activeCategory !== "ALL"
      ? categoryLabel || title || "Events"
      : "Events";

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-4 pb-12 sm:px-0 sm:pt-6">
      <header>
        {isArchive && (
          <Link
            href="/events"
            className="mb-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-text hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden /> All events
          </Link>
        )}
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate font-display text-3xl font-extrabold text-fg">{pageTitle}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="circleIcon" size="icon" aria-label="My tickets" title="My tickets">
              <Link href="/events/my-tickets">
                <Ticket />
              </Link>
            </Button>
            {!isArchive && (
              <Button asChild>
                <Link href="/events/new">
                  <Plus aria-hidden /> <span className="hidden sm:inline">Host an event</span>
                  <span className="sm:hidden">Host</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
        {!isArchive && (
          <p className="mt-1 text-sm text-fg-muted">Fests, hackathons and meetups. Tap one to register.</p>
        )}
      </header>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search events or clubs"
            aria-label="Search events"
            autoComplete="off"
            className="rounded-full pr-12 pl-10"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute top-0 right-0"
            >
              <X />
            </Button>
          )}
        </div>
        <Button
          variant="circleIcon"
          size="icon"
          onClick={() => setFiltersOpen(true)}
          aria-haspopup="dialog"
          aria-label={activeFilterCount ? `Filters, ${activeFilterCount} on` : "Filters"}
          className="relative"
        >
          <SlidersHorizontal />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-brand text-xs font-semibold tabular-nums text-brand-fg">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      <fieldset className="no-scrollbar -mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <legend className="sr-only">Category</legend>
        {CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            size="sm"
            selected={activeCategory === category.id}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.label}
          </Chip>
        ))}
      </fieldset>

      {!isArchive && (
        <SegmentedControl
          options={TABS}
          value={activeTab}
          onChange={setActiveTab}
          fullWidth
          aria-label="Show"
        />
      )}

      <EventFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_EVENT_FILTERS)}
      />

      {error ? (
        <EmptyState
          bordered
          size="compact"
          icon={CalendarDays}
          title="Events didn't load"
          description="Check your connection and try again."
          action={
            <Button variant="secondary" onClick={() => void mutate()}>
              Try again
            </Button>
          }
        />
      ) : isLoading && rawEvents.length === 0 ? (
        <div className="space-y-3" role="status" aria-label="Loading events">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : visibleEvents.length > 0 ? (
        <div className="space-y-3">
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} variant="row" />
          ))}
        </div>
      ) : (
        <EmptyState
          bordered
          size="compact"
          icon={CalendarDays}
          title={
            isArchive
              ? "No past events yet"
              : activeTab === "REGISTERED"
                ? "You haven't registered for anything"
                : "No events match"
          }
          description={
            filterActive
              ? "Try fewer filters or a different word."
              : "Got something planned? Put it here so people can find it."
          }
          action={
            filterActive ? (
              <Button variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : !isArchive ? (
              <Button asChild>
                <Link href="/events/new">Host an event</Link>
              </Button>
            ) : undefined
          }
        />
      )}

      {!isArchive && (
        <div className="flex justify-center pt-2">
          <Button asChild variant="ghost" className="min-h-11">
            <Link href="/events/closed">
              <History aria-hidden /> See past events
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
