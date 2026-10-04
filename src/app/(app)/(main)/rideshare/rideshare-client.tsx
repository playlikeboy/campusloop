"use client";

import {
  Car,
  Filter,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Search,
  Users,
  X,
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
  "All Routes",
  "Railway Station",
  "Airport",
  "City Center",
  "Bus Terminal",
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
      limit: "16",
    });
    if (urlSearch) params.set("q", urlSearch);
    return "/api/communities/feed?" + params.toString();
  }, [page, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<FeedResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const listings = useMemo(
    () =>
      (data?.items || [])
        .filter((item) => item.itemType === "RIDESHARE" && item.data)
        .map((item) => item.data),
    [data?.items]
  );

  return (
    <div className="min-h-screen pb-24">
      <ContextualLivingNav />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <Car className="size-3.5" />
              Verified Student Cab &amp; Auto Pool
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-foreground">
              Ride Share
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Split station, airport, and city cab fares with verified batchmates
            </p>
          </div>

          <Button asChild size="default" className="gap-2 font-bold shadow-sm bg-sky-600 hover:bg-sky-500 text-white">
            <Link href="/rideshare/new">
              <Plus className="size-4" />
              Offer a Ride
            </Link>
          </Button>
        </div>

        {/* Search & Common Destination Chips */}
        <div className="space-y-3">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by pickup or destination..."
              className="h-10 w-full rounded-xl bg-card pl-10 pr-9 text-sm font-medium border border-border/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Search rides"
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

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {COMMON_DESTINATIONS.map((dest) => {
              const isSelected = (dest === "All Routes" && !urlSearch) || urlSearch.toLowerCase() === dest.toLowerCase();
              return (
                <button
                  key={dest}
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    if (dest === "All Routes") setSearchQuery("");
                    else setSearchQuery(dest);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95",
                    isSelected
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MapPin className="size-3 text-sky-500" />
                  <span>{dest}</span>
                </button>
              );
            })}
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
            <Card className="p-12 text-center">
              <Car className="mx-auto size-8 text-destructive" />
              <h3 className="mt-3 text-base font-bold text-foreground">Could not load rides</h3>
              <p className="mt-1 text-xs text-muted-foreground">Please check your connection and retry.</p>
              <Button onClick={() => mutate()} variant="outline" size="sm" className="mt-4 font-bold">
                Retry
              </Button>
            </Card>
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((item) => (
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
                  Showing {listings.length} active student rides
                </p>
              </div>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                <Car className="size-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">No rides found for this route</h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {urlSearch
                  ? `No batchmates currently offering rides for "${urlSearch}". Try another destination or offer your own!`
                  : "No rides listed right now. Booking an auto or cab? Offer empty seats and save fare!"}
              </p>
              <Button asChild size="sm" className="mt-5 font-bold bg-sky-600 hover:bg-sky-500 text-white">
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
              Updating available rides...
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
