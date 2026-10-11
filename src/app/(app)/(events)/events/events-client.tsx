"use client";

import {
  BookOpen,
  BookmarkCheck,
  Briefcase,
  Calendar,
  Clock,
  Code2,
  Compass,
  Filter,
  Flame,
  Globe,
  Grid3X3,
  LayoutList,
  Menu,
  Mic,
  PartyPopper,
  Plus,
  RotateCcw,
  School,
  Search,
  Sparkles,
  Ticket,
  Trophy,
  Users2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { EventCard, type EventItem, isEventClosed } from "@/components/events/event-card";
import {
  EventFeaturedSkeleton,
  EventMetricsSkeleton,
  EventsListSkeleton,
} from "@/components/events/event-card-skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

// ─── Unstop-Grade Categories ────────────────────────────────────────────────
const CATEGORIES = [
  { id: "ALL", label: "All Opportunities", icon: Compass },
  { id: "HACKATHON", label: "Hackathons", icon: Code2 },
  { id: "QUIZ", label: "Quizzes & Trivia", icon: Zap },
  { id: "COMPETITION", label: "Case Comps", icon: Trophy },
  { id: "FEST", label: "College Fests", icon: PartyPopper },
  { id: "WORKSHOP", label: "Workshops", icon: BookOpen },
  { id: "HIRING", label: "Hiring Challenges", icon: Briefcase },
  { id: "SEMINAR", label: "Conferences", icon: Mic },
] as const;

// ─── Unstop Primary Status Tabs ─────────────────────────────────────────────
type StatusTab = "ALL" | "CLOSING_SOON" | "REGISTERED";

// ─── Filter Options ─────────────────────────────────────────────────────────
const MODES = [
  { id: "ALL", label: "All Modes" },
  { id: "ONLINE", label: "Online" },
  { id: "OFFLINE", label: "On-Campus" },
  { id: "HYBRID", label: "Hybrid" },
] as const;

const PARTICIPATION_TYPES = [
  { id: "ALL", label: "All Types" },
  { id: "SOLO", label: "Solo / Individual" },
  { id: "TEAM", label: "Teams" },
] as const;

const FEE_TYPES = [
  { id: "ALL", label: "All Fees" },
  { id: "FREE", label: "Free Only" },
  { id: "PAID", label: "Paid" },
] as const;

const SORT_OPTIONS = [
  { id: "trending", label: "Trending" },
  { id: "closing_soon", label: "Closing Soonest" },
  { id: "highest_prize", label: "Highest Rewards" },
  { id: "upcoming", label: "Starting Soon" },
  { id: "latest", label: "Recently Added" },
] as const;

interface EventMetrics {
  totalOpportunities: number;
  liveHackathons: number;
  cashPrizeCount: number;
  totalPrizePool: string;
  totalRegistrations: number;
}

interface ApiResponse {
  events?: EventItem[];
  metrics?: EventMetrics;
}

export function EventsClient() {
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [scope, setScope] = useState<"ALL" | "MY_CAMPUS">("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [participationFilter, setParticipationFilter] = useState<string>("ALL");
  const [feeFilter, setFeeFilter] = useState<string>("ALL");
  const [hasPrizesFilter, setHasPrizesFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [now, setNow] = useState(() => Date.now());

  // Sync client time for live countdowns
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Construct query string for backend API
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "ALL") params.set("category", activeCategory);
    if (scope !== "ALL") params.set("scope", scope);
    if (modeFilter !== "ALL") params.set("mode", modeFilter);
    if (participationFilter !== "ALL") params.set("participationType", participationFilter);
    if (feeFilter !== "ALL") params.set("fee", feeFilter);
    if (hasPrizesFilter) params.set("hasPrizes", "true");
    if (sortBy !== "trending") params.set("sort", sortBy);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    return `/api/events?${params.toString()}`;
  }, [
    activeCategory,
    scope,
    modeFilter,
    participationFilter,
    feeFilter,
    hasPrizesFilter,
    sortBy,
    searchQuery,
  ]);

  // Fetch events from API
  const { data: responseData, isLoading } = useSWR<ApiResponse | EventItem[]>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  // Safely unpack raw events to prevent any "TypeError: filter is not a function"
  const rawEvents: EventItem[] = useMemo(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData.events)) return responseData.events;
    return [];
  }, [responseData]);

  // Extract server metrics with safe fallbacks
  const metrics: EventMetrics = useMemo(() => {
    if (responseData && !Array.isArray(responseData) && responseData.metrics) {
      return responseData.metrics;
    }
    const total = rawEvents.length;
    const hackathons = rawEvents.filter((e) => e.eventType === "HACKATHON").length;
    const prizes = rawEvents.filter((e) => Boolean(e.prizesDescription)).length;
    const totalRegs = rawEvents.reduce((acc, e) => acc + (e.attendeeCount || 0), 0);
    return {
      totalOpportunities: total,
      liveHackathons: hackathons,
      cashPrizeCount: prizes,
      totalPrizePool: "₹15,00,000+",
      totalRegistrations: totalRegs,
    };
  }, [responseData, rawEvents]);

  // Client-side filtering for tab status (ALL vs CLOSING_SOON vs REGISTERED)
  const activeEvents = useMemo(() => {
    const curNow = now;
    if (!Array.isArray(rawEvents)) return [];

    return rawEvents.filter((e) => {
      // Must NOT be closed or cancelled for live view
      if (isEventClosed(e, curNow)) return false;

      // Status tab: Closing soon
      if (activeTab === "CLOSING_SOON") {
        if (!e.registrationDeadline) return false;
        const deadlineMs = new Date(e.registrationDeadline).getTime();
        const diffMs = deadlineMs - curNow;
        if (diffMs <= 0 || diffMs > 3 * 24 * 60 * 60 * 1000) return false;
      }

      // Status tab: Registered / Saved by current user
      if (activeTab === "REGISTERED") {
        if (!e.isRegistered && !e.reminderSet) return false;
      }

      return true;
    });
  }, [rawEvents, activeTab, now]);

  // Featured Spotlight Opportunity (Unstop hero pick)
  const featuredEvent = useMemo(() => {
    if (activeEvents.length === 0) return null;
    return (
      activeEvents.find(
        (e) => (e.prizesDescription && e.prizesDescription.length > 0) || e.attendeeCount > 5
      ) || activeEvents[0]
    );
  }, [activeEvents]);

  // Live countdown ticker for featured opportunity
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
    activeCategory !== "ALL" ||
    modeFilter !== "ALL" ||
    participationFilter !== "ALL" ||
    feeFilter !== "ALL" ||
    hasPrizesFilter ||
    sortBy !== "trending" ||
    activeTab !== "ALL" ||
    Boolean(searchQuery);

  function handleResetFilters() {
    sounds.tap();
    haptics.light();
    setActiveTab("ALL");
    setActiveCategory("ALL");
    setModeFilter("ALL");
    setParticipationFilter("ALL");
    setFeeFilter("ALL");
    setHasPrizesFilter(false);
    setSortBy("trending");
    setSearchQuery("");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-background pb-28 px-3 sm:px-6">
      {/* ─── Top Sticky Header & Navigation Omnibar ─── */}
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
              <Trophy className="size-4 sm:size-4.5" />
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                Opportunities
              </h1>
              {!isLoading && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/60 shrink-0">
                  {activeEvents.length}
                </span>
              )}
            </div>
          </div>

          {/* Scope Pill (All India vs Campus) & View Switcher */}
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
                title="View opportunities across all Indian universities"
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
                title="View opportunities exclusive to your university"
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

            {/* List External Opportunity Button (Desktop only) */}
            <Link
              href="/events/new?type=external"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="hidden sm:flex h-8 items-center gap-1.5 px-3 rounded-xl bg-card hover:bg-muted/70 text-foreground border border-border/50 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Globe className="size-3.5 text-primary" />
              <span>List External Hackathon</span>
            </Link>

            {/* Organizer Dashboard */}
            <Link
              href="/events/dashboard"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="hidden md:flex h-8 items-center gap-1.5 px-3 rounded-xl bg-card hover:bg-muted/70 text-foreground border border-border/50 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Manage your hosted events and track registrations"
            >
              <Calendar className="size-3.5 text-primary" />
              <span>Organizer</span>
            </Link>

            {/* Host Event Button */}
            <Link
              href="/events/new"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="flex h-8 items-center gap-1.5 px-3 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="size-3.5" />
              <span>Host</span>
            </Link>
          </div>
        </div>

        {/* Row 2: Status Tabs (Streamlined for mobile) */}
        <div className="pt-2 pb-2.5 space-y-2 border-t border-border/40">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center p-0.5 rounded-xl bg-muted/70 border border-border/50 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setActiveTab("ALL");
                }}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "ALL"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Calendar className="size-3.5" />
                <span>Live</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setActiveTab("CLOSING_SOON");
                }}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "CLOSING_SOON"
                    ? "bg-background text-rose-600 dark:text-rose-400 shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Flame className="size-3.5 text-rose-500 animate-pulse" />
                <span>Closing Soon</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setActiveTab("REGISTERED");
                }}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "REGISTERED"
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookmarkCheck className="size-3.5" />
                <span>Registered</span>
              </button>

              <Link
                href="/events/closed"
                className="hidden sm:flex px-3 py-1 rounded-lg text-muted-foreground hover:text-foreground transition-all items-center gap-1"
              >
                <span>Archive</span>
              </Link>

              <Link
                href="/events/my-tickets"
                className="hidden sm:flex px-3 py-1 rounded-lg text-muted-foreground hover:text-foreground transition-all items-center gap-1"
              >
                <Ticket className="size-3 text-primary" />
                <span>My Passes</span>
              </Link>
            </div>

            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all cursor-pointer",
                  showAdvancedFilters || hasPrizesFilter || modeFilter !== "ALL" || participationFilter !== "ALL" || feeFilter !== "ALL" || sortBy !== "trending"
                    ? "bg-primary/10 text-primary font-bold"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Show filters and sorting"
                aria-expanded={showAdvancedFilters}
              >
                <Filter className="size-3.5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Search Omnibar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events and hackathons..."
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

          {/* Categories Pill Strip (Unstop Opportunity Tracks) */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
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
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border",
                    isActive
                      ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border-border/50"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Expandable Advanced Filters (Mode, Participation, Fee, Prizes) */}
          {showAdvancedFilters && (
            <div className="pt-2 pb-1 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Mode
                </label>
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="w-full h-7.5 rounded-lg border border-border/60 bg-muted/30 px-2 text-xs text-foreground outline-none"
                >
                  {MODES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Participation
                </label>
                <select
                  value={participationFilter}
                  onChange={(e) => setParticipationFilter(e.target.value)}
                  className="w-full h-7.5 rounded-lg border border-border/60 bg-muted/30 px-2 text-xs text-foreground outline-none"
                >
                  {PARTICIPATION_TYPES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Fee
                </label>
                <select
                  value={feeFilter}
                  onChange={(e) => setFeeFilter(e.target.value)}
                  className="w-full h-7.5 rounded-lg border border-border/60 bg-muted/30 px-2 text-xs text-foreground outline-none"
                >
                  {FEE_TYPES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    sounds.tap();
                    setSortBy(e.target.value);
                  }}
                  aria-label="Sort opportunities"
                  className="h-7.5 w-full rounded-lg bg-muted/40 px-2 text-xs font-medium text-foreground outline-none cursor-pointer hover:bg-muted"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Rewards
                </label>
                <button
                  type="button"
                  onClick={() => setHasPrizesFilter((prev) => !prev)}
                  className={cn(
                    "w-full h-7.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    hasPrizesFilter
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Trophy className="size-3" />
                  <span>Cash Prizes</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Filter Bar & Reset */}
          {isAnyFilterActive && (
            <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground border-t border-border/30">
              <span>
                Showing <strong>{activeEvents.length}</strong> matching opportunities
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ─── Unstop Stats / Metrics Strip ─── */}
      {isLoading ? (
        <div className="hidden sm:block"><EventMetricsSkeleton /></div>
      ) : (
        <div className="hidden sm:grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-3">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-primary">
              <Compass className="size-4 sm:size-4.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Active
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {metrics.totalOpportunities}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">Campus Opportunities</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-amber-500">
              <Trophy className="size-4 sm:size-4.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Rewards
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {metrics.totalPrizePool}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">Total Prize Pool</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-indigo-500">
              <Code2 className="size-4 sm:size-4.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Build
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {metrics.liveHackathons}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">Campus Hackathons</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-500">
              <Users2 className="size-4 sm:size-4.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Verified
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {metrics.totalRegistrations}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">Student Registrations</p>
          </div>
        </div>
      )}

      {/* ─── Featured Spotlight Card (Unstop Premier Hackathon / Case Comp) ─── */}
      {isLoading ? (
        <div className="hidden sm:block"><EventFeaturedSkeleton /></div>
      ) : featuredEvent && !isAnyFilterActive ? (
        <div className="hidden sm:block py-2 sm:py-3">
          <Link
            href={`/events/${featuredEvent.slug || featuredEvent.id}`}
            className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card p-4 sm:p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold border border-primary/20">
                  <Sparkles className="size-3" />
                  Featured Opportunity
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  {featuredEvent.clubName}
                </span>
                {featuredEvent.institution && (
                  <span className="hidden md:inline text-xs text-muted-foreground">
                    · {featuredEvent.institution.name}
                  </span>
                )}
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
                      {String(countdown.minutes).padStart(2, "0")}m:
                      {String(countdown.seconds).padStart(2, "0")}s
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
                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <Trophy className="size-3" />
                        {featuredEvent.prizesDescription}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span>{featuredEvent.attendeeCount} registered</span>
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
      ) : null}

      {/* ─── Opportunities Listing Section ─── */}
      <div className="pt-3">
        {isLoading ? (
          <EventsListSkeleton count={6} variant={viewMode} />
        ) : activeEvents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-8 space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/50">
              <Calendar className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">No Opportunities Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isAnyFilterActive
                  ? "Try resetting filters or searching for another keyword."
                  : "All current opportunities are concluded. Check out our archive."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {isAnyFilterActive ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reset All Filters</span>
                </button>
              ) : (
                <Link
                  href="/events/closed"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/95 transition-all"
                >
                  <span>Browse Past Archive</span>
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
              <p className="text-xs font-bold text-foreground">
                Looking for past events?
              </p>
              <p className="text-[11px] text-muted-foreground">
                Browse concluded events and winners in the archive.
              </p>
            </div>
            <Link
              href="/events/closed"
              className="px-3.5 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground transition-all shrink-0"
            >
              View archive →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
