"use client";

import {
  Calendar,
  Clock,
  Code2,
  Compass,
  Flame,
  Globe,
  GraduationCap,
  Grid3X3,
  LayoutList,
  MapPin,
  PartyPopper,
  Plus,
  Radio,
  RotateCcw,
  School,
  Search,
  Sparkles,
  Trophy,
  Users,
  Users2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { EventCard, type EventItem } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const EVENT_TABS = [
  { id: "trending", label: "Trending", icon: Flame },
  { id: "upcoming", label: "Upcoming", icon: Calendar },
  { id: "latest", label: "Latest", icon: Sparkles },
] as const;

const TIMEFRAMES = [
  { id: "ALL", label: "Anytime" },
  { id: "TODAY", label: "Today / Tomorrow" },
  { id: "WEEKEND", label: "This Weekend" },
  { id: "MONTH", label: "This Month" },
] as const;

const CATEGORIES = [
  { id: "ALL", label: "All Events", icon: Calendar },
  { id: "hackathons", label: "Hackathons", icon: Code2 },
  { id: "fests", label: "Fests", icon: PartyPopper },
  { id: "competitions", label: "Competitions", icon: Trophy },
  { id: "workshops", label: "Workshops", icon: GraduationCap },
  { id: "meetups", label: "Meetups", icon: Users2 },
];

const MODES = [
  { id: "ALL", label: "All Modes", icon: null },
  { id: "IN_PERSON", label: "In-Person", icon: MapPin },
  { id: "ONLINE", label: "Online", icon: Globe },
  { id: "HYBRID", label: "Hybrid", icon: Zap },
];

export function EventsClient() {
  const [activeTab, setActiveTab] = useState<"trending" | "upcoming" | "latest">("trending");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [timeframeFilter, setTimeframeFilter] = useState<"ALL" | "TODAY" | "WEEKEND" | "MONTH">("ALL");
  const [scope, setScope] = useState<"ALL" | "MY_CAMPUS">("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Live countdown state for featured banner
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("campusloop_events_view_mode");
      if (saved === "grid" || saved === "list") {
        setViewMode(saved);
      }
    }
  }, []);

  function handleViewModeChange(mode: "grid" | "list") {
    sounds.tap();
    haptics.light();
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("campusloop_events_view_mode", mode);
    }
  }

  function handleResetFilters() {
    sounds.pop();
    haptics.light();
    setActiveCategory("ALL");
    setTimeframeFilter("ALL");
    setModeFilter("ALL");
    setSearchQuery("");
  }

  const endpoint = `/api/events?category=${activeCategory}&scope=${scope}&sort=${activeTab}&q=${encodeURIComponent(
    searchQuery
  )}`;
  const { data, isLoading } = useSWR<{ events: EventItem[] }>(endpoint, fetcher, {
    dedupingInterval: 15000,
    revalidateOnFocus: true,
  });

  const rawEvents = data?.events || [];

  // Filter by mode and timeframe
  const events = useMemo(() => {
    return rawEvents.filter((e) => {
      // Mode filter
      if (modeFilter !== "ALL") {
        const evMode = (e.mode || "").toUpperCase();
        if (modeFilter === "IN_PERSON" && evMode !== "IN_PERSON" && evMode !== "OFFLINE") return false;
        if (modeFilter === "ONLINE" && evMode !== "ONLINE") return false;
        if (modeFilter === "HYBRID" && evMode !== "HYBRID") return false;
      }

      // Timeframe filter
      if (timeframeFilter !== "ALL") {
        const start = new Date(e.startDate).getTime();
        const curDate = new Date();
        if (timeframeFilter === "TODAY") {
          const tomorrowEnd = new Date(curDate);
          tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
          tomorrowEnd.setHours(23, 59, 59, 999);
          if (start < curDate.getTime() || start > tomorrowEnd.getTime()) return false;
        } else if (timeframeFilter === "WEEKEND") {
          const day = curDate.getDay();
          const daysToFriday = (5 - day + 7) % 7;
          const friday = new Date(curDate);
          friday.setDate(curDate.getDate() + daysToFriday);
          friday.setHours(0, 0, 0, 0);
          const sunday = new Date(friday);
          sunday.setDate(friday.getDate() + 2);
          sunday.setHours(23, 59, 59, 999);
          if (start < friday.getTime() || start > sunday.getTime()) return false;
        } else if (timeframeFilter === "MONTH") {
          const monthEnd = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0, 23, 59, 59, 999);
          if (start < curDate.getTime() || start > monthEnd.getTime()) return false;
        }
      }

      return true;
    });
  }, [rawEvents, modeFilter, timeframeFilter]);

  // Featured Spotlight Event
  const featuredEvent = useMemo(() => {
    if (events.length === 0) return null;
    return events.find((e) => e.prizesDescription) || events[0];
  }, [events]);

  // Live countdown for featured event
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

  // Stats calculation
  const totalRegistered = rawEvents.reduce((acc, curr) => acc + (curr.attendeeCount || 0), 0);
  const hackathonsCount = rawEvents.filter((e) => e.eventType === "HACKATHON").length;
  const isAnyFilterActive =
    activeCategory !== "ALL" || modeFilter !== "ALL" || timeframeFilter !== "ALL" || Boolean(searchQuery);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-background pb-28 px-3 sm:px-6">
      {/* ─── Top Sticky Omnibar & Filter Strip ─── */}
      <header className="sticky top-0 z-40 -mx-3 sm:-mx-6 px-3 sm:px-6 border-b border-border/30 bg-background/90 backdrop-blur-xl transition-all">
        {/* Row 1: Title, Scope Switcher, View Switcher & Host Button */}
        <div className="flex h-13 sm:h-14 items-center justify-between gap-2.5">
          {/* Title & Count */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10 text-primary shrink-0 border border-primary/20">
              <Calendar className="size-4 sm:size-4.5" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-foreground truncate">
                <span className="sm:hidden">Events</span>
                <span className="hidden sm:inline">Events &amp; Hackathons</span>
              </h1>
              {rawEvents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {rawEvents.length}
                </span>
              )}
            </div>
          </div>

          {/* Scope Pill (All India vs My Campus), View Toggle, and Host CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Scope Switcher */}
            <div className="flex items-center rounded-full bg-muted/60 p-0.5 border border-border/40 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setScope("ALL");
                }}
                className={cn(
                  "px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                  scope === "ALL"
                    ? "bg-foreground text-background shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="View events across all colleges in India"
              >
                <Globe className="size-2.5 sm:size-3" />
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
                  "px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                  scope === "MY_CAMPUS"
                    ? "bg-foreground text-background shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="View events exclusive to your college campus"
              >
                <School className="size-2.5 sm:size-3" />
                <span>Campus</span>
              </button>
            </div>

            {/* View Switcher (Desktop/Tablet) */}
            <div className="hidden sm:flex items-center rounded-full bg-muted/50 p-0.5 border border-border/40">
              <button
                type="button"
                onClick={() => handleViewModeChange("grid")}
                className={cn(
                  "p-1.5 rounded-full transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid3X3 className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("list")}
                className={cn(
                  "p-1.5 rounded-full transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="List View"
                aria-label="List View"
              >
                <LayoutList className="size-3.5" />
              </button>
            </div>

            {/* Host CTA */}
            <Link
              href="/events/new"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="flex h-8 sm:h-8.5 shrink-0 cursor-pointer items-center gap-1 sm:gap-1.5 rounded-full bg-primary px-3 sm:px-3.5 text-xs font-black text-primary-foreground transition-all hover:opacity-90 active:scale-95 shadow-sm"
            >
              <Plus className="size-3.5 stroke-3" />
              <span className="sm:hidden">Host</span>
              <span className="hidden sm:inline">Host Event</span>
              <span className="hidden md:inline text-[9px] px-1.5 py-0.2 rounded-full bg-primary-foreground/20 font-mono">
                +25 LP
              </span>
            </Link>
          </div>
        </div>

        {/* Row 2: Search Input & Fast Horizontal Filter Strip */}
        <div className="py-2 space-y-2 border-t border-border/20">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search hackathons, cultural fests, workshops or clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 sm:h-9 w-full rounded-full border border-border/40 bg-muted/40 pl-8.5 pr-8 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Unified Filter Strip: Sort Tabs | Categories | Timeframe | Modes */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
            {/* Sort Tabs */}
            {EVENT_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setActiveTab(tab.id);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 border",
                    isActive
                      ? "bg-foreground text-background border-foreground font-black shadow-xs"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground border-border/40"
                  )}
                >
                  <Icon className="size-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-border/40 shrink-0 mx-0.5" />

            {/* Timeframe Quick Filters */}
            {TIMEFRAMES.map((tf) => {
              const isActive = timeframeFilter === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setTimeframeFilter(tf.id);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border flex items-center gap-1",
                    isActive
                      ? "bg-purple-600 text-white border-purple-500 font-black shadow-xs"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground border-border/40"
                  )}
                >
                  <Clock className="size-3" />
                  <span>{tf.label}</span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-border/40 shrink-0 mx-0.5" />

            {/* Categories */}
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
                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-black"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground border-border/40"
                  )}
                >
                  <Icon className="size-3" />
                  <span>{cat.label}</span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-border/40 shrink-0 mx-0.5" />

            {/* Modes */}
            {MODES.filter((m) => m.id !== "ALL").map((mode) => {
              const isActive = modeFilter === mode.id;
              const Icon = mode.icon;
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
                    "rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border flex items-center gap-1",
                    isActive
                      ? "bg-primary/20 text-primary border-primary/40 font-black shadow-xs"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground border-border/40"
                  )}
                >
                  {Icon && <Icon className="size-3" />}
                  <span>{mode.label}</span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-border/40 shrink-0 mx-0.5 sm:hidden" />

            {/* Mobile Quick View Mode Switcher */}
            <div className="flex sm:hidden items-center shrink-0">
              <button
                type="button"
                onClick={() => handleViewModeChange(viewMode === "grid" ? "list" : "grid")}
                className="rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border bg-muted/40 text-muted-foreground hover:text-foreground border-border/40 flex items-center gap-1"
              >
                {viewMode === "grid" ? <LayoutList className="size-3" /> : <Grid3X3 className="size-3" />}
                <span>{viewMode === "grid" ? "List" : "Grid"}</span>
              </button>
            </div>
          </div>

          {/* Active Filter Indicator & Reset Bar */}
          {isAnyFilterActive && (
            <div className="flex items-center justify-between text-xs py-1 px-1 text-muted-foreground">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>Showing <strong>{events.length}</strong> matching events</span>
                {timeframeFilter !== "ALL" && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                    {timeframeFilter}
                  </span>
                )}
                {activeCategory !== "ALL" && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                    {activeCategory}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer shrink-0"
              >
                <RotateCcw className="size-3" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ─── Highlights & Stats Ribbon (Desktop) ─── */}
      {!isLoading && rawEvents.length > 0 && !searchQuery && (
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 py-4">
          <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-3xl border border-border/30 bg-card/50 backdrop-blur-xs shadow-xs">
            <div className="flex size-9 sm:size-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0 border border-indigo-500/20">
              <Compass className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-black text-foreground">{rawEvents.length}</p>
              <p className="text-[11px] text-muted-foreground truncate font-medium">Active Events</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-3xl border border-border/30 bg-card/50 backdrop-blur-xs shadow-xs">
            <div className="flex size-9 sm:size-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 shrink-0 border border-purple-500/20">
              <Radio className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-black text-foreground">{hackathonsCount}</p>
              <p className="text-[11px] text-muted-foreground truncate font-medium">Live Hackathons</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-3xl border border-border/30 bg-card/50 backdrop-blur-xs shadow-xs">
            <div className="flex size-9 sm:size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shrink-0 border border-amber-500/20">
              <Users className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-black text-foreground">{totalRegistered}+</p>
              <p className="text-[11px] text-muted-foreground truncate font-medium">Students Enrolled</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-3xl border border-border/30 bg-card/50 backdrop-blur-xs shadow-xs">
            <div className="flex size-9 sm:size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
              <Zap className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-black text-foreground">+25 LP</p>
              <p className="text-[11px] text-muted-foreground truncate font-medium">Per Registration</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Featured Spotlight Banner with Live Ticking Countdown ─── */}
      {!isLoading && featuredEvent && !searchQuery && activeCategory === "ALL" && timeframeFilter === "ALL" && (
        <div className="pb-4">
          <Link
            href={`/events/${featuredEvent.slug || featuredEvent.id}`}
            className="group relative block overflow-hidden rounded-3xl border border-primary/30 bg-linear-to-br from-primary/15 via-card to-card p-4 sm:p-6 shadow-sm transition-all hover:border-primary/60 hover:shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-xs">
                  <Sparkles className="size-3" />
                  Featured Spotlight
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border/40 truncate max-w-[180px]">
                  {featuredEvent.clubName}
                </span>
              </div>

              {countdown && (
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-border/40 text-foreground">
                  <Clock className="size-3.5 text-primary shrink-0" />
                  {countdown.isLive ? (
                    <span className="text-red-500 font-black animate-pulse">🔴 HAPPENING NOW</span>
                  ) : (
                    <span>
                      {countdown.days > 0 && `${countdown.days}d `}
                      {String(countdown.hours).padStart(2, "0")}:{String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-col md:flex-row gap-3 sm:gap-5 items-start md:items-center justify-between">
              <div className="space-y-1 min-w-0 max-w-3xl">
                <h2 className="text-base sm:text-xl font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {featuredEvent.title}
                </h2>
                {featuredEvent.tagline && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {featuredEvent.tagline}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between w-full md:w-auto gap-3 shrink-0 pt-1 md:pt-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-foreground">{featuredEvent.attendeeCount} enrolled</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span className="font-bold text-primary">{featuredEvent.entryFee || "Free"}</span>
                </div>
                <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-black group-hover:opacity-90 transition-opacity shadow-xs shrink-0">
                  View Pass →
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ─── Stream of Event Cards (Grid or List Layout) ─── */}
      <div className="pt-1 sm:pt-2">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-72 sm:h-80 rounded-3xl bg-muted/30 border border-border/30 animate-pulse"
              />
            ))}
          </div>
        ) : events.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} variant="grid" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-4xl mx-auto">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} variant="row" />
              ))}
            </div>
          )
        ) : (
          <div className="py-24 text-center space-y-3 max-w-md mx-auto">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-muted/60 text-muted-foreground mx-auto border border-border/40">
              <Calendar className="size-7" />
            </div>
            <h3 className="text-base font-black text-foreground">No events found</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAnyFilterActive
                ? "No events match your current filter combination. Try resetting your search or date selection."
                : "No events match this filter. Be the first organizer to host a competition or meetup on your campus."}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {isAnyFilterActive && (
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs font-bold"
                >
                  Clear Filters
                </Button>
              )}
              <Link
                href="/events/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-black shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Host Event (+25 LP)</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
