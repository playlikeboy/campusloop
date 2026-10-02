"use client";

import {
  Archive,
  Calendar,
  ChevronLeft,
  Clock,
  Code2,
  Compass,
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
import { useMemo, useState } from "react";
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

export function ClosedEventsClient() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [scope, setScope] = useState<"ALL" | "MY_CAMPUS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("row" as any === "grid" ? "grid" : "list");

  // Fetch all events
  const { data: rawEvents = [], isLoading, mutate: mutateEvents } = useSWR<EventItem[]>(
    `/api/events?category=${activeCategory}&scope=${scope}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const [now] = useState(() => Date.now());

  // Filter only closed/past events
  const closedEvents = useMemo(() => {
    return rawEvents.filter((e) => {
      // Must be closed/past
      if (!isEventClosed(e, now)) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesClub = e.clubName.toLowerCase().includes(q);
        const matchesDesc = (e.description || "").toLowerCase().includes(q);
        const matchesVenue = (e.venue || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesClub && !matchesDesc && !matchesVenue) return false;
      }

      return true;
    });
  }, [rawEvents, searchQuery, now]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-background pb-28 px-3 sm:px-6">
      {/* ─── Top Sticky Omnibar ─── */}
      <header className="sticky top-0 z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 border-b border-border/50 bg-background/95 backdrop-blur-xl transition-all shadow-2xs">
        {/* Row 1: Title, Scope Switcher, View Switcher & Host Button */}
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

            <Link
              href="/events"
              className="flex size-8 sm:size-9 items-center justify-center rounded-xl sm:rounded-2xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
              title="Back to Live Events"
            >
              <ChevronLeft className="size-4" />
            </Link>

            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                Past &amp; Closed Events
              </h1>
              {closedEvents.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/60 shrink-0">
                  {closedEvents.length}
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
                title="View past events across all universities"
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
                title="View past events from your campus"
              >
                <School className="size-3" />
                <span>Campus</span>
              </button>
            </div>

            {/* View Switcher */}
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

        {/* Row 2: Search Input & Sub-Navigation Strip */}
        <div className="py-2.5 space-y-2.5 border-t border-border/40">
          {/* Unstop-style Primary Status Tabs: Live vs Closed */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center p-0.5 rounded-xl bg-muted/70 border border-border/50 text-xs font-semibold">
              <Link
                href="/events"
                className="px-3 py-1 rounded-lg text-muted-foreground hover:text-foreground transition-all"
              >
                Live &amp; Upcoming
              </Link>
              <span className="px-3 py-1 rounded-lg bg-background text-foreground shadow-xs font-bold">
                Closed &amp; Past
              </span>
            </div>

            <Link
              href="/events/new"
              className="flex h-7.5 items-center gap-1 px-3 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="size-3.5" />
              <span>Host Event</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past hackathons, college fests, or clubs..."
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

          {/* Categories Strip */}
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
          </div>
        </div>
      </header>

      {/* ─── Event Listings (Closed / Past Archive) ─── */}
      <div className="pt-4">
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
        ) : closedEvents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-8 space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/50">
              <Archive className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">No Concluded Events Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? `No past events match "${searchQuery}". Try clearing search or category filters.`
                  : "All current events on CampusLoop are actively ongoing or upcoming!"}
              </p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/95 transition-all"
            >
              <span>Explore Live Events</span>
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
            {closedEvents.map((event) => (
              <EventCard key={event.id} event={event} variant="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {closedEvents.map((event) => (
              <EventCard key={event.id} event={event} variant="row" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
