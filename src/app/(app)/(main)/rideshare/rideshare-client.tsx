"use client";

import {
  Building2,
  Car,
  Clock,
  Loader2,
  Navigation,
  Plane,
  Plus,
  Search,
  ShieldCheck,
  Train,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { RideshareCard } from "@/components/communities/rideshare-card";
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

const COMMON_DESTINATIONS = [
  { id: "all", label: "All Routes", icon: Navigation },
  { id: "Airport", label: "Airport", icon: Plane },
  { id: "Station", label: "Railway Station", icon: Train },
  { id: "City", label: "City Center & Mall", icon: Building2 },
  { id: "Metro", label: "Metro Station", icon: Train },
] as const;

export function RideshareClient({ profileId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("q") || "";
  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const [searchQuery, setSearchQuery] = useState(urlSearch);

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
      tab: "rideshare",
      page: String(page),
      limit: "18",
    });
    if (urlSearch) params.set("q", urlSearch);
    return "/api/communities/feed?" + params.toString();
  }, [page, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<FeedResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const rawListings = useMemo(
    () =>
      (data?.items || [])
        .filter((item) => item.itemType === "RIDESHARE" && item.data)
        .map((item) => item.data),
    [data?.items]
  );

  function filterByDestination(keyword: string) {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      if (keyword === "all") params.delete("q");
      else params.set("q", keyword);
      params.set("page", "1");
    });
  }

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground select-none">
      <ContextualLivingNav />

      <main className="mx-auto max-w-6xl px-3 sm:px-6 pt-5 space-y-6">
        {/* Clean Hero Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/30 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400">
              <Car className="size-3.5" />
              <span>Campus Cab &amp; Auto Pool</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Ride Share
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Coordinate cabs to railway stations, airport &amp; city center. Split fares safely with verified students.
            </p>
          </div>

          <Button asChild className="font-bold text-xs h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-xs shrink-0">
            <Link href="/rideshare/new">
              <Plus className="size-4 mr-1" />
              <span>Offer a Ride</span>
            </Link>
          </Button>
        </div>

        {/* Value Proposition Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl border border-border/40 bg-card/60 flex items-center gap-3">
            <div className="size-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Verified Students Only</p>
              <p className="text-[11px] text-muted-foreground">Safe travel with peers from your college</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-border/40 bg-card/60 flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Zap className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Split Up to 75% Fare</p>
              <p className="text-[11px] text-muted-foreground">Share Ola, Uber &amp; local taxi expenses</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-border/40 bg-card/60 flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Real-Time Coordination</p>
              <p className="text-[11px] text-muted-foreground">Direct chat &amp; seat reservation</p>
            </div>
          </div>
        </div>

        {/* Search & Quick Destination Filters */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Airport, Hatia Station, Ranchi Mall..."
                className="h-10 w-full rounded-xl bg-card pl-10 pr-9 text-xs sm:text-sm font-medium border border-border/50 outline-none transition focus:border-primary"
                aria-label="Search rideshare"
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

            {/* Quick Destination Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {COMMON_DESTINATIONS.map((dest) => {
                const Icon = dest.icon;
                const isSelected =
                  dest.id === "all" ? !urlSearch : urlSearch.toLowerCase().includes(dest.id.toLowerCase());
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => filterByDestination(dest.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs",
                      isSelected
                        ? "bg-foreground text-background shadow-xs"
                        : "bg-card border border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3" />
                    <span>{dest.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rides Grid */}
        <section className="space-y-6">
          {isLoading && !data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <Card className="p-12 text-center border border-border/40">
              <Car className="mx-auto size-8 text-destructive" />
              <h3 className="mt-3 text-base font-bold text-foreground">Could not load rides</h3>
              <p className="mt-1 text-xs text-muted-foreground">Please check your connection and retry.</p>
              <Button onClick={() => mutate()} variant="outline" size="sm" className="mt-4 font-bold">
                Retry
              </Button>
            </Card>
          ) : rawListings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rawListings.map((item) => (
                  <RideshareCard
                    key={item.id}
                    item={item}
                    currentUserId={profileId}
                  />
                ))}
              </div>

              <div className="flex flex-col items-center gap-2 pt-4">
                <Pagination page={data?.page || page} totalPages={data?.totalPages || 1} />
                <p className="text-xs text-muted-foreground">
                  Showing {rawListings.length} of {data?.total || rawListings.length} rides available
                </p>
              </div>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center border border-border/40">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                <Car className="size-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">No active ride pools found</h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {urlSearch
                  ? `No rides match "${urlSearch}". Try another destination or start a new cab pool.`
                  : "Heading to the station or airport soon? Start a cab pool and split the fare with batchmates!"}
              </p>
              <Button asChild size="sm" className="mt-5 font-bold text-xs bg-sky-600 hover:bg-sky-500 text-white">
                <Link href="/rideshare/new">
                  <Plus className="size-4 mr-1.5" />
                  Offer a Ride
                </Link>
              </Button>
            </Card>
          )}

          {isValidating && data ? (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-sky-500" />
              Syncing campus rides...
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
