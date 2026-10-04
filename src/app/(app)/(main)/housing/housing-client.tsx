"use client";

import {
  ArrowUpDown,
  CheckCircle2,
  Filter,
  Grid,
  Home,
  List as ListIcon,
  Loader2,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { HousingCard } from "@/components/communities/housing-card";
import { ContextualLivingNav } from "@/components/navigation/contextual-living-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface Props {
  profileId: string;
}

interface FeedResponse {
  items: any[];
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const BUDGET_FILTERS = [
  { id: "all", label: "Any Budget" },
  { id: "under_5k", label: "Under ₹5,000" },
  { id: "5k_10k", label: "₹5,000 - ₹10,000" },
  { id: "above_10k", label: "₹10,000+" },
] as const;

const GENDER_FILTERS = [
  { id: "all", label: "Any Gender" },
  { id: "BOYS_ONLY", label: "Boys Only" },
  { id: "GIRLS_ONLY", label: "Girls Only" },
  { id: "COED", label: "Co-ed" },
] as const;

const OCCUPANCY_FILTERS = [
  { id: "all", label: "Any Room Type" },
  { id: "SINGLE_ROOM", label: "Single Room" },
  { id: "DOUBLE_SHARING", label: "Double Sharing" },
  { id: "TRIPLE_SHARING", label: "Triple Sharing" },
  { id: "FULL_FLAT", label: "Full Flat / 2BHK" },
] as const;

export function HousingClient({ profileId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("q") || "";
  const budget = searchParams.get("budget") || "all";
  const gender = searchParams.get("gender") || "all";
  const occupancy = searchParams.get("occupancy") || "all";
  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => setSearchQuery(urlSearch), [urlSearch]);

  const updateUrl = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutator(params);
      const query = params.toString();
      router.replace(query ? pathname + "?" + query : pathname, { scroll: true });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const next = searchQuery.trim();
    if (next === urlSearch) return;

    const timer = window.setTimeout(() => {
      updateUrl((params) => {
        if (next) params.set("q", next);
        else params.delete("q");
        params.set("page", "1");
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery, updateUrl, urlSearch]);

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams({
      tab: "housing",
      page: String(page),
      limit: "16",
    });
    if (urlSearch) params.set("q", urlSearch);
    if (gender !== "all") params.set("gender", gender);
    if (occupancy !== "all") params.set("occupancy", occupancy);
    return "/api/communities/feed?" + params.toString();
  }, [gender, occupancy, page, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<FeedResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const rawListings = useMemo(
    () =>
      (data?.items || [])
        .filter((item) => item.itemType === "HOUSING" && item.data)
        .map((item) => item.data),
    [data?.items]
  );

  // Client-side budget filter helper
  const listings = useMemo(() => {
    return rawListings.filter((item) => {
      if (budget === "under_5k") return item.rentPerMonth < 5000;
      if (budget === "5k_10k") return item.rentPerMonth >= 5000 && item.rentPerMonth <= 10000;
      if (budget === "above_10k") return item.rentPerMonth > 10000;
      return true;
    });
  }, [budget, rawListings]);

  function setFilter(key: "budget" | "gender" | "occupancy", value: string) {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      if (value === "all") params.delete(key);
      else params.set(key, value);
      params.set("page", "1");
    });
  }

  const activeFiltersCount =
    (budget !== "all" ? 1 : 0) + (gender !== "all" ? 1 : 0) + (occupancy !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen pb-24">
      <ContextualLivingNav />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Housing Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Home className="size-3.5" />
              Verified Campus Housing &amp; Flatmates
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-foreground">
              Housing &amp; Flats
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified student PGs, rooms, shared apartments, and verified roommates near campus
            </p>
          </div>

          <Button asChild size="default" className="gap-2 font-bold shadow-sm bg-amber-600 hover:bg-amber-500 text-white">
            <Link href="/housing/new">
              <Plus className="size-4" />
              List a Room
            </Link>
          </Button>
        </div>

        {/* Search Bar + Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by area, PG name, or landmark..."
              className="h-10 w-full rounded-xl bg-card pl-10 pr-9 text-sm font-medium border border-border/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Search housing"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden gap-1.5 font-semibold"
            >
              <Filter className="size-3.5" />
              Filters
              {activeFiltersCount > 0 ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                  {activeFiltersCount}
                </span>
              ) : null}
            </Button>

            <div className="hidden sm:flex items-center rounded-xl border border-border/50 bg-card p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition",
                  viewMode === "grid"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Grid view"
              >
                <Grid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition",
                  viewMode === "list"
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="List view"
              >
                <ListIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Desktop Filter Sidebar + Listings */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
          <aside className="hidden lg:block space-y-6 rounded-2xl border border-border/40 bg-card p-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-amber-500" />
                <h2 className="text-sm font-bold text-foreground">Housing Filters</h2>
              </div>
              {activeFiltersCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    updateUrl((params) => {
                      params.delete("budget");
                      params.delete("gender");
                      params.delete("occupancy");
                      params.set("page", "1");
                    });
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Reset all
                </button>
              ) : null}
            </div>

            {/* Budget */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Monthly Rent
              </h3>
              <div className="space-y-1.5">
                {BUDGET_FILTERS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setFilter("budget", b.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition text-left",
                      budget === b.id
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span>{b.label}</span>
                    {budget === b.id ? <CheckCircle2 className="size-3.5 text-amber-500" /> : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender Preference */}
            <div className="border-t border-border/40 pt-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Gender Preference
              </h3>
              <div className="space-y-1.5">
                {GENDER_FILTERS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setFilter("gender", g.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition text-left",
                      gender === g.id
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span>{g.label}</span>
                    {gender === g.id ? <CheckCircle2 className="size-3.5 text-amber-500" /> : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Type / Occupancy */}
            <div className="border-t border-border/40 pt-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Occupancy / Room
              </h3>
              <div className="space-y-1.5">
                {OCCUPANCY_FILTERS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setFilter("occupancy", o.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition text-left",
                      occupancy === o.id
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span>{o.label}</span>
                    {occupancy === o.id ? <CheckCircle2 className="size-3.5 text-amber-500" /> : null}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Listings Area */}
          <section className="lg:col-span-3 space-y-6">
            {isLoading && !data ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <Card className="p-12 text-center">
                <Home className="mx-auto size-8 text-destructive" />
                <h3 className="mt-3 text-base font-bold text-foreground">Could not load housing</h3>
                <p className="mt-1 text-xs text-muted-foreground">Please check your connection and retry.</p>
                <Button onClick={() => mutate()} variant="outline" size="sm" className="mt-4 font-bold">
                  Retry
                </Button>
              </Card>
            ) : listings.length > 0 ? (
              <>
                <div
                  className={cn(
                    "grid gap-4",
                    viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                  )}
                >
                  {listings.map((item) => (
                    <HousingCard
                      key={item.id}
                      item={item}
                      currentUserId={profileId}
                      variant={viewMode === "list" ? "list" : "card"}
                    />
                  ))}
                </div>

                <div className="flex flex-col items-center gap-2 pt-4">
                  <Pagination page={data?.page || page} totalPages={data?.totalPages || 1} />
                  <p className="text-xs text-muted-foreground">
                    Showing {listings.length} verified flats and roommate openings
                  </p>
                </div>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                  <Home className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">No housing listings found</h3>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  {urlSearch
                    ? `No listings match "${urlSearch}". Try searching other areas near campus.`
                    : "No rooms match these filters. Try adjusting your budget or gender preference."}
                </p>
                <Button asChild size="sm" className="mt-5 font-bold bg-amber-600 hover:bg-amber-500 text-white">
                  <Link href="/housing/new">
                    <Plus className="size-4 mr-1.5" />
                    List a Room / Flat
                  </Link>
                </Button>
              </Card>
            )}

            {isValidating && data ? (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-amber-500" />
                Updating housing listings...
              </div>
            ) : null}
          </section>
        </div>
      </main>

      {/* Mobile Filter Sheet */}
      {mobileFilterOpen ? (
        <div
          onClick={() => setMobileFilterOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs lg:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background p-6 space-y-6 shadow-2xl border-t border-border/40"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-base font-bold text-foreground">Filter Housing</h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="size-8 flex items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Budget</h3>
              <div className="grid grid-cols-2 gap-2">
                {BUDGET_FILTERS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setFilter("budget", b.id);
                      setMobileFilterOpen(false);
                    }}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-semibold border transition text-center",
                      budget === b.id
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-card border-border/60 text-foreground"
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preference</h3>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_FILTERS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setFilter("gender", g.id);
                      setMobileFilterOpen(false);
                    }}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-semibold border transition text-center",
                      gender === g.id
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-card border-border/60 text-foreground"
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="w-full font-bold h-11 bg-amber-600 hover:bg-amber-500 text-white"
            >
              Apply Housing Filters
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
