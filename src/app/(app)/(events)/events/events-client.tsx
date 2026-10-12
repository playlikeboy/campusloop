"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { CalendarDays, ChevronDown, Filter, Plus, Search, SlidersHorizontal, Ticket, X } from "lucide-react";
import { EventCard, isEventClosed, type EventItem } from "@/components/events/event-card";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  { id: "seminars", label: "Talks" },
  { id: "gaming", label: "Gaming" },
  { id: "meetups", label: "Meetups" },
];

const MODES = [
  { value: "ALL", label: "Any mode" },
  { value: "ONLINE", label: "Online" },
  { value: "OFFLINE", label: "On campus" },
  { value: "HYBRID", label: "Hybrid" },
];

const FEES = [
  { value: "ALL", label: "Any price" },
  { value: "FREE", label: "Free" },
  { value: "PAID", label: "Paid" },
];

const SORTS = [
  { value: "trending", label: "Recommended" },
  { value: "upcoming", label: "Date: soonest" },
  { value: "closing_soon", label: "Registration closing" },
  { value: "latest", label: "Recently added" },
];

function pillClass(active: boolean) {
  return cn(
    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
    active ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
  );
}

export function EventsClient({
  initialCategory = "ALL",
  initialStatus = "ACTIVE",
  title,
}: EventsClientProps) {
  const isArchive = initialStatus === "CLOSED";
  const [activeTab, setActiveTab] = useState<ActiveTab>("ALL");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [scope, setScope] = useState<"ALL" | "MY_CAMPUS">("ALL");
  const [mode, setMode] = useState("ALL");
  const [fee, setFee] = useState("ALL");
  const [participation, setParticipation] = useState("ALL");
  const [hasPrizes, setHasPrizes] = useState(false);
  const [sort, setSort] = useState("trending");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 260);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isFiltersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsFiltersOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFiltersOpen]);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "ALL") params.set("category", activeCategory);
    const effectiveScope = activeTab === "REGISTERED" ? "REGISTERED" : scope;
    if (effectiveScope !== "ALL") params.set("scope", effectiveScope);
    if (isArchive) {
      params.set("status", "CLOSED");
    } else if (activeTab === "CLOSING_SOON") {
      params.set("status", "CLOSING_SOON");
    }
    if (mode !== "ALL") params.set("mode", mode);
    if (fee !== "ALL") params.set("fee", fee);
    if (participation !== "ALL") params.set("participationType", participation);
    if (hasPrizes) params.set("hasPrizes", "true");
    if (sort !== "trending") params.set("sort", sort);
    if (debouncedSearch) params.set("q", debouncedSearch);
    return "/api/events?" + params.toString();
  }, [activeCategory, activeTab, scope, isArchive, mode, fee, participation, hasPrizes, sort, debouncedSearch]);

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

  const filterActive =
    search.trim().length > 0 ||
    activeCategory !== initialCategory ||
    scope !== "ALL" ||
    mode !== "ALL" ||
    fee !== "ALL" ||
    participation !== "ALL" ||
    hasPrizes ||
    sort !== "trending" ||
    activeTab !== "ALL";

  const activeFilterCount = [
    activeCategory !== initialCategory,
    scope !== "ALL",
    mode !== "ALL",
    fee !== "ALL",
    participation !== "ALL",
    hasPrizes,
    sort !== "trending",
  ].filter(Boolean).length;

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setActiveCategory(initialCategory);
    setScope("ALL");
    setMode("ALL");
    setFee("ALL");
    setParticipation("ALL");
    setHasPrizes(false);
    setSort("trending");
    setActiveTab("ALL");
  }

  const pageTitle = isArchive ? (title || "Past events") : activeCategory !== "ALL" ? (CATEGORIES.find((category) => category.id === activeCategory)?.label || title || "Events") : "Events";
  const opportunityCount = rawEvents.filter((event) => {
    const type = String(event.eventType || "").toUpperCase();
    return ["COMPETITION", "HACKATHON", "WORKSHOP", "SEMINAR"].includes(type) && !isEventClosed(event);
  }).length;
  const nextDeadlineCount = rawEvents.filter((event) => {
    const deadline = event.registrationDeadline ? new Date(event.registrationDeadline).getTime() : 0;
    return deadline > Date.now() && deadline <= Date.now() + 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4 pb-12 pt-3 sm:space-y-5 sm:pt-6">
      {!isArchive && (
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">CampusLoop discovery</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Make your next move count.</h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Find hackathons, contests, workshops and student-led campus events in one place. Host your own event separately from the opportunities you discover.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">{opportunityCount} opportunities</span>
                <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">{nextDeadlineCount} deadlines in 7 days</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/events/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"><Plus className="size-4" /> Host an event</Link>
              <Link href="/events/closed" className="inline-flex h-10 items-center justify-center rounded-full border border-border/70 bg-background/70 px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted">Past events</Link>
            </div>
          </div>
        </div>
      )}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{pageTitle}</h2>
          {!isLoading && <p className="mt-0.5 text-xs text-muted-foreground">{visibleEvents.length} events and opportunities</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/events/my-tickets" aria-label="My tickets" title="My tickets" className="inline-flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Ticket className="size-4" />
          </Link>
          {!isArchive && <Link href="/events/new" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"><Plus className="size-4" /><span>Host</span></Link>}
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search events"
          aria-label="Search events"
          autoComplete="off"
          className="h-11 w-full rounded-xl bg-muted/50 pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-primary/20"
        />
        {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"><X className="size-3.5" /></button>}
      </div>

      <div className="hidden sm:flex no-scrollbar items-center gap-2 overflow-x-auto pb-0.5">
        {CATEGORIES.map((category) => (
          <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={pillClass(activeCategory === category.id)}>{category.label}</button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        {!isArchive ? (
          <div className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto">
            {([
              ["ALL", "Active"],
              ["CLOSING_SOON", "Closing soon"],
              ["REGISTERED", "Registered"],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} className={pillClass(activeTab === id)}>{label}</button>
            ))}
          </div>
        ) : (
          <Link href="/events" className="text-xs font-medium text-primary hover:underline">← All events</Link>
        )}
        <details className="group relative hidden shrink-0 sm:block">
          <summary className={cn("flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-full px-3 text-xs font-medium", mode !== "ALL" || fee !== "ALL" || participation !== "ALL" || hasPrizes || sort !== "trending" ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground hover:text-foreground")}>
            <Filter className="size-3.5" /> Filters <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 z-20 mt-2 grid w-[min(82vw,300px)] gap-3 rounded-2xl bg-popover p-4 text-popover-foreground shadow-xl ring-1 ring-border/50">
            <label className="grid gap-1.5 text-xs font-medium">Mode
              <select value={mode} onChange={(event) => setMode(event.target.value)} className="h-9 rounded-lg bg-muted/60 px-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/20">
                {MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium">Participation
              <select value={participation} onChange={(event) => setParticipation(event.target.value)} className="h-9 rounded-lg bg-muted/60 px-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/20">
                <option value="ALL">Solo or team</option><option value="SOLO">Solo</option><option value="TEAM">Team</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium">Price
              <select value={fee} onChange={(event) => setFee(event.target.value)} className="h-9 rounded-lg bg-muted/60 px-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/20">
                {FEES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium">Sort
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 rounded-lg bg-muted/60 px-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/20">
                {SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
              <input type="checkbox" checked={hasPrizes} onChange={(event) => setHasPrizes(event.target.checked)} className="size-4 accent-primary" /> Prize or rewards
            </label>
            <label className="grid gap-1.5 text-xs font-medium">Campus
              <select value={scope} onChange={(event) => setScope(event.target.value as "ALL" | "MY_CAMPUS")} className="h-9 rounded-lg bg-muted/60 px-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/20">
                <option value="ALL">All India</option><option value="MY_CAMPUS">My campus</option>
              </select>
            </label>
            {filterActive && <button type="button" onClick={resetFilters} className="mt-1 h-9 rounded-full bg-muted text-xs font-semibold hover:bg-muted/80">Reset filters</button>}
          </div>
        </details>
        <button
          type="button"
          onClick={() => setIsFiltersOpen(true)}
          className={cn(
            "relative inline-flex sm:hidden size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            activeFilterCount > 0 ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
          )}
          aria-label={"Open event filters" + (activeFilterCount ? ", " + activeFilterCount + " active" : "")}
          aria-haspopup="dialog"
          aria-expanded={isFiltersOpen}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {isFiltersOpen && (
        <div className="fixed inset-0 z-[100] sm:hidden">
          <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={() => setIsFiltersOpen(false)} aria-label="Close event filters" />
          <section role="dialog" aria-modal="true" aria-labelledby="event-filters-title" className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border/50 bg-card px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] text-card-foreground shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/25" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 id="event-filters-title" className="text-base font-bold">Filters</h2>
                <p className="text-xs text-muted-foreground">{activeFilterCount ? activeFilterCount + " active" : "All events"}</p>
              </div>
              <button type="button" onClick={() => setIsFiltersOpen(false)} className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Close event filters"><X className="size-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold">Category</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((category) => (
                    <button key={category.id} type="button" aria-pressed={activeCategory === category.id} onClick={() => setActiveCategory(category.id)} className={cn("min-h-10 rounded-xl border px-3 text-left text-sm font-medium transition-colors", activeCategory === category.id ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-muted/30 text-foreground")}>{category.label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-xs font-medium">Mode
                  <select value={mode} onChange={(event) => setMode(event.target.value)} className="h-11 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm font-normal text-foreground outline-none focus-visible:border-primary/50">{MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                </label>
                <label className="grid gap-1.5 text-xs font-medium">Participation
                  <select value={participation} onChange={(event) => setParticipation(event.target.value)} className="h-11 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm font-normal text-foreground outline-none focus-visible:border-primary/50"><option value="ALL">Solo or team</option><option value="SOLO">Solo</option><option value="TEAM">Team</option></select>
                </label>
                <label className="grid gap-1.5 text-xs font-medium">Price
                  <select value={fee} onChange={(event) => setFee(event.target.value)} className="h-11 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm font-normal text-foreground outline-none focus-visible:border-primary/50">{FEES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                </label>
                <label className="grid gap-1.5 text-xs font-medium">Sort by
                  <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm font-normal text-foreground outline-none focus-visible:border-primary/50">{SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                </label>
              </div>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-muted/30 px-3 text-sm font-medium">
                <input type="checkbox" checked={hasPrizes} onChange={(event) => setHasPrizes(event.target.checked)} className="size-4 accent-primary" />
                Prize or rewards
              </label>
              <div className="space-y-2">
                <p className="text-xs font-semibold">Campus</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={scope === "MY_CAMPUS"} onClick={() => setScope("MY_CAMPUS")} className={cn("min-h-10 rounded-xl border px-3 text-sm font-medium transition-colors", scope === "MY_CAMPUS" ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-muted/30 text-foreground")}>My campus</button>
                  <button type="button" aria-pressed={scope === "ALL"} onClick={() => setScope("ALL")} className={cn("min-h-10 rounded-xl border px-3 text-sm font-medium transition-colors", scope === "ALL" ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-muted/30 text-foreground")}>All India</button>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border/30 pt-3">
              <button type="button" onClick={resetFilters} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">Reset all</button>
              <button type="button" onClick={() => setIsFiltersOpen(false)} className="min-h-11 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Done</button>
            </div>
          </section>
        </div>
      )}

      {!isArchive && <div className="flex items-center justify-end"><Link href="/events/closed" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Past events →</Link></div>}

      {error ? (
        <div className="rounded-2xl bg-muted/40 px-4 py-10 text-center">
          <p className="text-sm font-semibold">Events couldn’t load</p>
          <button type="button" onClick={() => void mutate()} className="mt-2 text-xs font-semibold text-primary hover:underline">Try again</button>
        </div>
      ) : isLoading && rawEvents.length === 0 ? (
        <div className="space-y-3" aria-label="Loading events"><div className="h-28 animate-pulse rounded-2xl bg-muted/50" /><div className="h-28 animate-pulse rounded-2xl bg-muted/50" /><div className="h-28 animate-pulse rounded-2xl bg-muted/50" /></div>
      ) : visibleEvents.length > 0 ? (
        <div className="space-y-2.5">{visibleEvents.map((event) => <EventCard key={event.id} event={event} variant="row" />)}</div>
      ) : (
        <div className="rounded-2xl bg-muted/30 px-4 py-12 text-center">
          <CalendarDays className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-sm font-semibold">{isArchive ? "No past events found" : activeTab === "REGISTERED" ? "No registrations yet" : "No events found"}</h2>
          {filterActive && <button type="button" onClick={resetFilters} className="mt-2 text-xs font-semibold text-primary hover:underline">Clear filters</button>}
        </div>
      )}
    </section>
  );
}
