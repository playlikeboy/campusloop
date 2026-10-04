"use client";

import {
  ArrowUpDown,
  Bike,
  BookOpen,
  CheckCircle2,
  Compass,
  Filter,
  Grid,
  Home,
  Laptop,
  List as ListIcon,
  Loader2,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Wind,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { MarketplaceCard } from "@/components/communities/marketplace-card";
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

const CATEGORIES = [
  { id: "all", label: "All Categories", icon: ShoppingBag },
  { id: "Cycles", label: "Cycles & Bikes", icon: Bike },
  { id: "Textbooks", label: "Textbooks & Notes", icon: BookOpen },
  { id: "Coolers", label: "Coolers & Fans", icon: Wind },
  { id: "Electronics", label: "Electronics", icon: Laptop },
  { id: "Lab Coats", label: "Drafters & Tools", icon: Compass },
  { id: "Furniture", label: "Mattresses & Furniture", icon: Home },
  { id: "Other", label: "Other Essentials", icon: Tag },
] as const;

const PRICE_FILTERS = [
  { id: "all", label: "Any Price" },
  { id: "under_500", label: "Under ₹500" },
  { id: "500_2000", label: "₹500 - ₹2,000" },
  { id: "above_2000", label: "₹2,000+" },
] as const;

export function BuyAndSellClient({ profileId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const price = searchParams.get("price") || "all";
  const available = searchParams.get("available") === "1";
  const sort = searchParams.get("sort") || "newest";
  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
      tab: "buy-and-sell",
      page: String(page),
      limit: "18",
    });
    if (urlSearch) params.set("q", urlSearch);
    if (category !== "all") params.set("category", category);
    if (price !== "all") params.set("price", price);
    if (available) params.set("available", "1");
    if (sort !== "newest") params.set("sort", sort);
    return "/api/communities/feed?" + params.toString();
  }, [available, category, page, price, sort, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<FeedResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const rawListings = useMemo(
    () =>
      (data?.items || [])
        .filter((item) => item.itemType === "MARKETPLACE" && item.data)
        .map((item) => item.data)
        .filter((item) => !deletedIds[item.id]),
    [data?.items, deletedIds]
  );

  // Client-side sort support if backend doesn't handle all price orders
  const listings = useMemo(() => {
    const list = [...rawListings];
    if (sort === "price_asc") {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sort === "price_desc") {
      return list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [rawListings, sort]);

  function setFilter(key: "category" | "price" | "sort", value: string) {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      if (value === "all" || (key === "sort" && value === "newest")) params.delete(key);
      else params.set(key, value);
      params.set("page", "1");
    });
  }

  function handleItemDeleted(itemId: string) {
    setDeletedIds((prev) => ({ ...prev, [itemId]: true }));
    void mutate();
  }

  const activeFiltersCount = (category !== "all" ? 1 : 0) + (price !== "all" ? 1 : 0) + (available ? 1 : 0);

  return (
    <div className="min-h-screen pb-24">
      <ContextualLivingNav />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Marketplace Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="size-3.5" />
              Verified Campus Marketplace
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-foreground">
              Buy &amp; Sell
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified second-hand college essentials directly between batchmates
            </p>
          </div>

          <Button asChild size="default" className="gap-2 font-bold shadow-sm">
            <Link href="/buy-and-sell/new">
              <Plus className="size-4" />
              List an Item
            </Link>
          </Button>
        </div>

        {/* Search & Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cycles, drafters, mattresses..."
              className="h-10 w-full rounded-xl bg-card pl-10 pr-9 text-sm font-medium border border-border/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Search marketplace"
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

          {/* Sort & View Mode Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Mobile Filter Button */}
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

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ArrowUpDown className="size-3.5" />
              <select
                value={sort}
                onChange={(e) => setFilter("sort", e.target.value)}
                className="h-9 rounded-xl border border-border/50 bg-card px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
                aria-label="Sort listings"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Grid / List View Toggle */}
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

        {/* Category Pill Strip for Fast Access */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter("category", cat.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95",
                  isSelected
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="size-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Main Layout: Desktop Sidebar Filters + Product Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-6 rounded-2xl border border-border/40 bg-card p-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Filters</h2>
              </div>
              {activeFiltersCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    updateUrl((params) => {
                      params.delete("category");
                      params.delete("price");
                      params.delete("available");
                      params.set("page", "1");
                    });
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Reset all
                </button>
              ) : null}
            </div>

            {/* Price Filter Group */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Price Range
              </h3>
              <div className="space-y-1.5">
                {PRICE_FILTERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFilter("price", p.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition text-left",
                      price === p.id
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span>{p.label}</span>
                    {price === p.id ? <CheckCircle2 className="size-3.5 text-primary" /> : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="border-t border-border/40 pt-4">
              <label className="flex items-center justify-between cursor-pointer text-xs font-medium text-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Available Only
                </span>
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => {
                    updateUrl((params) => {
                      if (e.target.checked) params.set("available", "1");
                      else params.delete("available");
                      params.set("page", "1");
                    });
                  }}
                  className="size-4 rounded accent-primary"
                />
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <section className="lg:col-span-3 space-y-6">
            {isLoading && !data ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <Card className="p-12 text-center">
                <ShoppingBag className="mx-auto size-8 text-destructive" />
                <h3 className="mt-3 text-base font-bold text-foreground">Could not load listings</h3>
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
                    viewMode === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1"
                  )}
                >
                  {listings.map((item) => (
                    <MarketplaceCard
                      key={item.id}
                      item={item}
                      currentUserId={profileId}
                      onDeleted={handleItemDeleted}
                      variant={viewMode === "list" ? "list" : "card"}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex flex-col items-center gap-2 pt-4">
                  <Pagination page={data?.page || page} totalPages={data?.totalPages || 1} />
                  <p className="text-xs text-muted-foreground">
                    Showing {listings.length} of {data?.total || listings.length} verified listings
                  </p>
                </div>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                  <ShoppingBag className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">No listings found</h3>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  {urlSearch
                    ? `No campus listings match "${urlSearch}". Try broader keywords or change filters.`
                    : "No items listed in this category yet. Be the first student to post!"}
                </p>
                <Button asChild size="sm" className="mt-5 font-bold">
                  <Link href="/buy-and-sell/new">
                    <Plus className="size-4 mr-1.5" />
                    Sell an Item
                  </Link>
                </Button>
              </Card>
            )}

            {isValidating && data ? (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                Updating marketplace...
              </div>
            ) : null}
          </section>
        </div>
      </main>

      {/* Mobile Filter Sheet Modal */}
      {mobileFilterOpen ? (
        <div
          onClick={() => setMobileFilterOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs lg:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[80vh] overflow-y-auto rounded-t-3xl bg-background p-6 space-y-6 shadow-2xl border-t border-border/40"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-base font-bold text-foreground">Filter Marketplace</h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="size-8 flex items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Price Range
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PRICE_FILTERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setFilter("price", p.id);
                      setMobileFilterOpen(false);
                    }}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-semibold border transition text-center",
                      price === p.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border/60 text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card">
                <span className="text-xs font-bold text-foreground">Available items only</span>
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => {
                    updateUrl((params) => {
                      if (e.target.checked) params.set("available", "1");
                      else params.delete("available");
                      params.set("page", "1");
                    });
                    setMobileFilterOpen(false);
                  }}
                  className="size-4 rounded accent-primary"
                />
              </label>
            </div>

            <Button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="w-full font-bold h-11"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
