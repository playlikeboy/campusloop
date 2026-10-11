"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { CalendarDays, ChevronDown, Filter, Plus, Search, Ticket, X } from "lucide-react";
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

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4 pb-12 pt-3 sm:space-y-5 sm:pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{pageTitle}</h1>
          {!isLoading && <p className="mt-0.5 text-xs text-muted-foreground">{visibleEvents.length} events</p>}
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

      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
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
        <details className="group relative shrink-0">
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
      </div>

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
