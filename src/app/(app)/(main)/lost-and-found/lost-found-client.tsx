"use client";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Filter,
  Globe,
  Loader2,
  PackageSearch,
  Plus,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
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
  campusId?: string | null;
}

interface ApiResponse {
  items: any[];
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  userCampusId?: string | null;
}

const TYPE_FILTERS = [
  { id: "all", label: "All Items" },
  { id: "LOST", label: "Lost Only", color: "text-rose-500" },
  { id: "FOUND", label: "Found Only", color: "text-emerald-500" },
  { id: "RESOLVED", label: "Resolved" },
] as const;

const CATEGORY_FILTERS = [
  "All",
  "Electronics",
  "ID & Cards",
  "Keys",
  "Cycles",
  "Bags",
  "Clothing",
  "Books",
  "Other",
] as const;

export function LostFoundClient({ profileId, campusId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("q") || "";
  const filterType = searchParams.get("type") || "all";
  const filterCategory = searchParams.get("category") || "All";
  const scope = (searchParams.get("scope") as "MY_CAMPUS" | "ALL") || "MY_CAMPUS";
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
      page: String(page),
      limit: "18",
      scope,
    });
    if (urlSearch) params.set("q", urlSearch);
    if (filterType !== "all") {
      if (filterType === "RESOLVED") {
        params.set("isResolved", "true");
      } else {
        params.set("type", filterType);
        params.set("isResolved", "false");
      }
    } else {
      params.set("isResolved", "false");
    }
    if (filterCategory !== "All") params.set("category", filterCategory);

    return "/api/lost-and-found?" + params.toString();
  }, [filterCategory, filterType, page, scope, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const listings = data?.items || [];

  function setType(typeId: string) {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      if (typeId === "all") params.delete("type");
      else params.set("type", typeId);
      params.set("page", "1");
    });
  }

  function setCategory(cat: string) {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      if (cat === "All") params.delete("category");
      else params.set("category", cat);
      params.set("page", "1");
    });
  }

  function setScope(nextScope: "MY_CAMPUS" | "ALL") {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      params.set("scope", nextScope);
      params.set("page", "1");
    });
  }

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground select-none">
      <ContextualLivingNav />

      <main className="mx-auto max-w-6xl px-3 sm:px-6 pt-5 space-y-6">
        {/* Header Hero Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/30 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
              <PackageSearch className="size-3.5" />
              <span>Campus Recovery Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Lost &amp; Found
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Report missing student IDs, keys, earphones, cycles &amp; safely reunite belongings with fellow students.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Campus Scope Toggle (My Campus vs All Campuses) */}
            <div className="flex items-center p-1 rounded-2xl bg-muted/40 border border-border/40 text-xs font-bold">
              <button
                type="button"
                onClick={() => setScope("MY_CAMPUS")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                  scope === "MY_CAMPUS"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <School className="size-3.5 text-primary" />
                <span>My Campus</span>
              </button>
              <button
                type="button"
                onClick={() => setScope("ALL")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                  scope === "ALL"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="size-3.5" />
                <span>All Campuses</span>
              </button>
            </div>

            <Button asChild className="font-bold text-xs h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-xs">
              <Link href="/lost-and-found/new">
                <Plus className="size-4 mr-1" />
                <span>Report Item</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search IDs, earphones, calculators, keys, cycles..."
                className="h-10 w-full rounded-xl bg-card pl-10 pr-9 text-xs sm:text-sm font-medium border border-border/50 outline-none transition focus:border-primary"
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
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {TYPE_FILTERS.map((f) => {
                const isSelected = filterType === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setType(f.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                      isSelected
                        ? "bg-foreground text-background shadow-xs"
                        : "bg-card border border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
            <span className="text-[10px] font-black uppercase text-muted-foreground shrink-0 mr-1">
              Category:
            </span>
            {CATEGORY_FILTERS.map((cat) => {
              const isSelected = filterCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : "bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {cat}
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
            <Card className="p-12 text-center border border-border/40">
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
                  Showing {listings.length} of {data?.total || listings.length} items • {scope === "MY_CAMPUS" ? "Local Campus Scope" : "All Colleges Across India"}
                </p>
              </div>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center border border-border/40">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                <PackageSearch className="size-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">No reports found</h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {urlSearch
                  ? `No missing items match "${urlSearch}". Try a different keyword.`
                  : scope === "MY_CAMPUS"
                  ? "All clear on your campus! Switch to 'All Campuses' or report a lost/found item below."
                  : "All clear across colleges! If you lost or found something, report it to verified students."}
              </p>
              <div className="mt-5 flex items-center gap-2">
                {scope === "MY_CAMPUS" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScope("ALL")}
                    className="font-bold text-xs"
                  >
                    <Globe className="size-3.5 mr-1" />
                    Check All Campuses
                  </Button>
                )}
                <Button asChild size="sm" className="font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white">
                  <Link href="/lost-and-found/new">
                    <Plus className="size-3.5 mr-1" />
                    Report an Item
                  </Link>
                </Button>
              </div>
            </Card>
          )}

          {isValidating && data ? (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-rose-500" />
              Syncing recovery listings...
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
