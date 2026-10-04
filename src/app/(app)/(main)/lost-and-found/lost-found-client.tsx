"use client";

import {
  Calendar,
  CheckCircle2,
  Filter,
  Loader2,
  PackageSearch,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { LostFoundCard } from "@/components/communities/lost-found-card";
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

const TYPE_FILTERS = [
  { id: "all", label: "All Items" },
  { id: "LOST", label: "Lost Only", color: "text-rose-500" },
  { id: "FOUND", label: "Found Only", color: "text-emerald-500" },
  { id: "RESOLVED", label: "Resolved" },
] as const;

export function LostFoundClient({ profileId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("q") || "";
  const filterType = searchParams.get("type") || "all";
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
      tab: "lost_found",
      page: String(page),
      limit: "16",
    });
    if (urlSearch) params.set("q", urlSearch);
    if (filterType !== "all" && filterType !== "RESOLVED") params.set("itemType", filterType);
    return "/api/communities/feed?" + params.toString();
  }, [filterType, page, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<FeedResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const rawListings = useMemo(
    () =>
      (data?.items || [])
        .filter((item) => item.itemType === "LOST_FOUND" && item.data)
        .map((item) => item.data),
    [data?.items]
  );

  const listings = useMemo(() => {
    if (filterType === "RESOLVED") {
      return rawListings.filter((i) => i.isResolved);
    }
    if (filterType === "LOST") {
      return rawListings.filter((i) => i.type === "LOST" && !i.isResolved);
    }
    if (filterType === "FOUND") {
      return rawListings.filter((i) => i.type === "FOUND" && !i.isResolved);
    }
    return rawListings;
  }, [filterType, rawListings]);

  function setType(val: string) {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      if (val === "all") params.delete("type");
      else params.set("type", val);
      params.set("page", "1");
    });
  }

  return (
    <div className="min-h-screen pb-24">
      <ContextualLivingNav />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <PackageSearch className="size-3.5" />
              Campus Recovery System
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-foreground">
              Lost &amp; Found
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Report missing items, student IDs, keys, earphones, and safely return found belongings
            </p>
          </div>

          <Button asChild size="default" className="gap-2 font-bold shadow-sm bg-rose-600 hover:bg-rose-500 text-white">
            <Link href="/lost-and-found/new">
              <Plus className="size-4" />
              Report an Item
            </Link>
          </Button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student IDs, keys, calculators, bags..."
              className="h-10 w-full rounded-xl bg-card pl-10 pr-9 text-sm font-medium border border-border/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Search lost and found"
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

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {TYPE_FILTERS.map((f) => {
              const isSelected = filterType === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setType(f.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition",
                    isSelected
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Listings Grid */}
        <section className="space-y-6">
          {isLoading && !data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <Card className="p-12 text-center">
              <PackageSearch className="mx-auto size-8 text-destructive" />
              <h3 className="mt-3 text-base font-bold text-foreground">Could not load items</h3>
              <p className="mt-1 text-xs text-muted-foreground">Please check your connection and retry.</p>
              <Button onClick={() => mutate()} variant="outline" size="sm" className="mt-4 font-bold">
                Retry
              </Button>
            </Card>
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((item) => (
                  <LostFoundCard
                    key={item.id}
                    item={item}
                    currentUserId={profileId}
                  />
                ))}
              </div>

              <div className="flex flex-col items-center gap-2 pt-4">
                <Pagination page={data?.page || page} totalPages={data?.totalPages || 1} />
                <p className="text-xs text-muted-foreground">
                  Showing {listings.length} campus items
                </p>
              </div>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                <PackageSearch className="size-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">No items in this category</h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {urlSearch
                  ? `No missing items match "${urlSearch}". Try a different keyword.`
                  : "All clear! If you lost or found something around campus, post it now."}
              </p>
              <Button asChild size="sm" className="mt-5 font-bold bg-rose-600 hover:bg-rose-500 text-white">
                <Link href="/lost-and-found/new">
                  <Plus className="size-4 mr-1.5" />
                  Report an Item
                </Link>
              </Button>
            </Card>
          )}

          {isValidating && data ? (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-rose-500" />
              Updating recovery listings...
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
