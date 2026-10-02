"use client";

import {
  Calendar,
  Clock,
  Code2,
  Compass,
  Filter,
  Flame,
  Globe,
  Grid3X3,
  LayoutList,
  MapPin,
  Menu,
  PartyPopper,
  Plus,
  RotateCcw,
  School,
  Search,
  Sparkles,
  Trophy,
  Users2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { EventCard, type EventItem, isEventClosed } from "@/components/events/event-card";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "ALL", label: "All Categories", icon: Compass },
  { id: "HACKATHON", label: "Hackathons", icon: Code2 },
  { id: "FEST", label: "College Fests", icon: PartyPopper },
  { id: "WORKSHOP", label: "Workshops", icon: Sparkles },
  { id: "COMPETITION", label: "Competitions", icon: Trophy },
  { id: "CULTURAL", label: "Cultural", icon: Users2 },
] as const;

const MODES = [
  { id: "ALL", label: "All Modes" },
  { id: "ONLINE", label: "Online Only" },
  { id: "OFFLINE", label: "On-Campus" },
] as const;

const TIMEFRAMES = [
  { id: "ALL", label: "Anytime" },
  { id: "WEEK", label: "This Week" },
  { id: "MONTH", label: "This Month" },
] as const;

export function EventsClient() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [scope, setScope] = useState<"ALL" | "MY_CAMPUS">("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [timeframeFilter, setTimeframeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [now, setNow] = useState(() => Date.now());

  // Sync client time for live countdowns
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all events from API
  const { data: rawEvents = [], isLoading, mutate: mutateEvents } = useSWR<EventItem[]>(
    `/api/events?category=${activeCategory}&scope=${scope}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  // Filter for LIVE & UPCOMING events (excluding closed/past)
  const activeEvents = useMemo(() => {
    const curNow = now;
    return rawEvents.filter((e) => {
      // Must NOT be closed
      if (isEventClosed(e, curNow)) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesClub = e.clubName.toLowerCase().includes(q);
        const matchesDesc = (e.description || "").toLowerCase().includes(q);
        const matchesVenue = (e.venue || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesClub && !matchesDesc && !matchesVenue) return false;
      }

      // Mode filter
      if (modeFilter !== "ALL") {
        if (modeFilter === "ONLINE" && e.mode !== "ONLINE") return false;
        if (modeFilter === "OFFLINE" && e.mode !== "OFFLINE" && e.mode !== "IN_PERSON") return false;
      }

      // Timeframe filter
      if (timeframeFilter !== "ALL") {
        const start = new Date(e.startDate).getTime();
        const curDate = new Date();
        if (timeframeFilter === "WEEK") {
          const weekEnd = new Date(curDate);
          weekEnd.setDate(weekEnd.getDate() + 7);
          if (start > weekEnd.getTime()) return false;
        } else if (timeframeFilter === "MONTH") {
          const monthEnd = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0, 23, 59, 59);
          if (start > monthEnd.getTime()) return false;
        }
      }

      return true;
    });
  }, [rawEvents, searchQuery, modeFilter, timeframeFilter, now]);

  // Featured Opportunity
  const featuredEvent = useMemo(() => {
    if (activeEvents.length === 0) return null;
    return (
      activeEvents.find(
        (e) => (e.prizesDescription && e.prizesDescription.length > 0) || e.attendeeCount > 10
      ) || activeEvents[0]
    );
  }, [activeEvents]);

  // Clean Countdown for Featured Event
  const countdown = useMemo(() => {
    if (!featuredEvent || now === 0) return null;
    const startMs = new Date(featuredEvent.startDate).getTime();
    const diff = startMs - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, isLive: false };
  }, [featuredEvent, now]);

  const isAnyFilterActive =
    activeCategory !== "ALL" || modeFilter !== "ALL" || timeframeFilter !== "ALL" || Boolean(searchQuery);

  function handleResetFilters() {
    sounds.tap();
    haptics.light();
    setActiveCategory("ALL");
    setModeFilter("ALL");
    setTimeframeFilter("ALL");
    setSearchQuery("");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-background pb-28 px-3 sm:px-6">
      {/* ─── Top Sticky Omnibar (Unstop-Grade Clean Architecture) ─── */}
      <header className="sticky top-0 z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 border-b border-border/50 bg-background/95 backdrop-blur-xl transition-all shadow-2xs">
        {/* Row 1: Brand/Menu, Title, Scope Switcher, View Switcher & Host CTA */}
        <div className="flex h-12 sm:h-14 items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("campusloop_open_mobile_drawer"));
                }
              }}
              className="flex size-8 sm:size-9 items-center justify-center rounded-xl sm:rounded-2xl hover:bg-muted/70 text-foreground transition-all cursor-pointer active:scale-95 shrink-0"
              aria-label="Open navigation menu"
              title="All Hubs & Navigation"
            >
              <Menu className="size-4.5" />
            </button>

            <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10 text-primary shrink-0 border border-primary/20">
              <Calendar className="size-4 sm:size-4.5" />
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                Campus Events
              </h1>
              {activeEvents.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/60 shrink-0">
                  {activeEvents.length}
                </span>
              )}
            </div>
          </div>

          {/* Scope Pill & View Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center rounded-xl bg-muted/60 p-0.5 border border-border/50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setScope("ALL");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                  scope === "ALL"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="View events across all colleges in India"
              >
                <Globe className="size-3" />
                <span>All India</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setScope("MY_CAMPUS");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                  scope === "MY_CAMPUS"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="View events exclusive to your campus"
              >
                <School className="size-3" />
                <span>Campus</span>
              </button>
            </div>

            {/* View Switcher (Desktop) */}
            <div className="hidden sm:flex items-center rounded-xl bg-muted/60 p-0.5 border border-border/50">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid3X3 className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="List View"
                aria-label="List View"
              >
                <LayoutList className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Unstop-style Navigation Tabs + Search + Secondary Filters */}
        <div className="py-2.5 space-y-2.5 border-t border-border/40">
          {/* Main Status Switcher: Live & Upcoming vs Closed Events + Host CTA */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center p-0.5 rounded-xl bg-muted/70 border border-border/50 text-xs font-semibold">
              <span className="px-3 py-1 rounded-lg bg-background text-foreground shadow-xs font-bold">
                Live &amp; Upcoming
              </span>
              <Link
                href="/events/closed"
                className="px-3 py-1 rounded-lg text-muted-foreground hover:text-foreground transition-all"
              >
                Closed &amp; Past
              </Link>
            </div>

            <Link
              href="/events/new"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="flex h-7.5 items-center gap-1.5 px-3 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="size-3.5" />
              <span>Host Event</span>
              <span className="hidden md:inline text-[9px] px-1 py-0.2 rounded bg-black/20 font-mono">
                +25 LP
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hackathons, fests, workshops, or clubs..."
              className="h-9 w-full rounded-xl border border-border/60 bg-muted/30 pl-9 pr-8 text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Unified Filter Strip: Categories + Mode + Timeframe */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
            {/* Category Chips */}
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setActiveCategory(cat.id);
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border",
                    isActive
                      ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border-border/50"
                  )}
                >
                  <Icon className="size-3" />
                  <span>{cat.label}</span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-border/50 shrink-0 mx-1" />

            {/* Mode Chips */}
            {MODES.filter((m) => m.id !== "ALL").map((mode) => {
              const isActive = modeFilter === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setModeFilter(modeFilter === mode.id ? "ALL" : mode.id);
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border",
                    isActive
                      ? "bg-primary/15 text-primary border-primary/40 font-bold"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border-border/50"
                  )}
                >
                  <span>{mode.label}</span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-border/50 shrink-0 mx-1" />

            {/* Timeframe Chips */}
            {TIMEFRAMES.filter((tf) => tf.id !== "ALL").map((tf) => {
              const isActive = timeframeFilter === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setTimeframeFilter(timeframeFilter === tf.id ? "ALL" : tf.id);
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border",
                    isActive
                      ? "bg-primary/15 text-primary border-primary/40 font-bold"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border-border/50"
                  )}
                >
                  <span>{tf.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Bar & Reset */}
          {isAnyFilterActive && (
            <div className="flex items-center justify-between text-xs pt-0.5 text-muted-foreground">
              <span>
                Found <strong>{activeEvents.length}</strong> live &amp; upcoming events
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ─── Featured Opportunity Spotlight (Clean Unstop Card) ─── */}
      {!isLoading && featuredEvent && !isAnyFilterActive && (
        <div className="py-4">
          <Link
            href={`/events/${featuredEvent.slug || featuredEvent.id}`}
            className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card p-4 sm:p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold border border-primary/20">
                  <Sparkles className="size-3" />
                  Featured Opportunity
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {featuredEvent.clubName}
                </span>
              </div>

              {countdown && (
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
                  <Clock className="size-3.5 text-primary shrink-0" />
                  {countdown.isLive ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-rose-600 animate-ping" />
                      Live Now
                    </span>
                  ) : (
                    <span>
                      Starts in {countdown.days > 0 ? `${countdown.days}d ` : ""}
                      {String(countdown.hours).padStart(2, "0")}h:
                      {String(countdown.minutes).padStart(2, "0")}m
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {featuredEvent.title}
                </h2>
                {featuredEvent.tagline && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {featuredEvent.tagline}
                  </p>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {featuredEvent.entryFee || "Free Entry"}
                  </span>
                  <span>·</span>
                  <span>{featuredEvent.mode === "ONLINE" ? "Online" : "On-Campus"}</span>
                  {featuredEvent.prizesDescription && (
                    <>
                      <span>·</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {featuredEvent.prizesDescription}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span>{featuredEvent.attendeeCount} enrolled</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center">
                <span className="inline-flex h-8.5 items-center px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all shadow-xs group-hover:bg-primary/95">
                  View Opportunity →
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ─── Active Event Opportunities ─── */}
      <div className={cn("pt-2", (!featuredEvent || isAnyFilterActive) && "pt-4")}>
        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-44 rounded-2xl border border-border/50 bg-card/60 p-4 animate-pulse space-y-3"
              >
                <div className="h-4 w-1/3 bg-muted rounded-md" />
                <div className="h-6 w-3/4 bg-muted rounded-md" />
                <div className="h-16 bg-muted/60 rounded-xl" />
              </div>
            ))}
          </div>
        ) : activeEvents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-8 space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/50">
              <Calendar className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">No Live Events Matching Criteria</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isAnyFilterActive
                  ? "Try broadening your category or mode filters, or search for other terms."
                  : "Check out past hackathons and fests in the Closed Events archive."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {isAnyFilterActive ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reset Filters</span>
                </button>
              ) : (
                <Link
                  href="/events/closed"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/95 transition-all"
                >
                  <span>Browse Closed Events</span>
                </Link>
              )}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
            {activeEvents.map((event) => (
              <EventCard key={event.id} event={event} variant="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {activeEvents.map((event) => (
              <EventCard key={event.id} event={event} variant="row" />
            ))}
          </div>
        )}

        {/* Closed Events Archive Footer Banner */}
        {!isLoading && (
          <div className="mt-8 p-4 rounded-2xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="text-xs font-bold text-foreground">Looking for past competitions or fest archives?</p>
              <p className="text-[11px] text-muted-foreground">
                Browse concluded university hackathons and winning records in the Closed Events directory.
              </p>
            </div>
            <Link
              href="/events/closed"
              className="px-3.5 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground transition-all shrink-0"
            >
              View Closed Events →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
