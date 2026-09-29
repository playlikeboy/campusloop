"use client";

import {
  ArrowLeft,
  Bike,
  BookOpen,
  CheckCircle2,
  Compass,
  Home,
  Laptop,
  Loader2,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Wind,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { MarketplaceCard } from "@/components/communities/marketplace-card";
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
  { id: "all", label: "All Items", icon: ShoppingBag },
  { id: "Cycles", label: "Cycles & Bikes", icon: Bike },
  { id: "Textbooks", label: "Textbooks & Notes", icon: BookOpen },
  { id: "Coolers", label: "Coolers & Fans", icon: Wind },
  { id: "Electronics", label: "Electronics", icon: Laptop },
  { id: "Lab Coats", label: "Drafters & Tools", icon: Compass },
  { id: "Furniture", label: "Mattresses & Furniture", icon: Home },
  { id: "Other", label: "Other Essentials", icon: Tag },
] as const;

const PRICE_FILTERS = [
  { id: "all", label: "All Prices" },
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
  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});

  useEffect(() => setSearchQuery(urlSearch), [urlSearch]);

  function updateUrl(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    const query = params.toString();
    router.replace(query ? pathname + "?" + query : pathname, { scroll: true });
  }

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
  }, [searchQuery, urlSearch]);

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams({
      tab: "buy-and-sell",
      page: String(page),
      limit: "15",
    });
    if (urlSearch) params.set("q", urlSearch);
    if (category !== "all") params.set("category", category);
    if (price !== "all") params.set("price", price);
    if (available) params.set("available", "1");
    return "/api/communities/feed?" + params.toString();
  }, [available, category, page, price, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<FeedResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const listings = useMemo(
    () =>
      (data?.items || [])
        .filter((item) => item.itemType === "MARKETPLACE" && item.data)
        .map((item) => item.data)
        .filter((item) => !deletedIds[item.id]),
    [data?.items, deletedIds]
  );

  function setFilter(key: "category" | "price", value: string) {
    sounds.tap();
    haptics.light();
    updateUrl((params) => {
      if (value === "all") params.delete(key);
      else params.set(key, value);
      params.set("page", "1");
    });
  }

  function handleItemDeleted(itemId: string) {
    setDeletedIds((prev) => ({ ...prev, [itemId]: true }));
    void mutate();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl pb-28">
      <header className="sticky top-14 z-30 space-y-3 bg-background/85 px-3 py-3 backdrop-blur-xl sm:px-4 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Go back"
            >
              <ArrowLeft className="size-4.5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black tracking-tight">Buy &amp; Sell</h1>
              <p className="text-xs text-muted-foreground">Verified campus marketplace</p>
            </div>
          </div>

          <Link
            href="/buy-and-sell/new"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-extrabold text-primary-foreground shadow-sm active:scale-95"
          >
            <Plus className="size-3.5" />
            Sell Item
          </Link>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search bicycles, books, electronics..."
            className="h-11 w-full rounded-2xl bg-muted/45 pl-11 pr-10 text-sm font-medium outline-none ring-1 ring-foreground/5 transition focus:bg-card focus:ring-primary/30"
            aria-label="Search marketplace"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((item) => {
            const Icon = item.icon;
            const selected = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter("category", item.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition active:scale-95",
                  selected
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/35 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto border-t border-border/10 pt-2 scrollbar-none">
          {PRICE_FILTERS.map((item) => {
            const selected = price === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter("price", item.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition",
                  selected
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              sounds.tap();
              haptics.light();
              updateUrl((params) => {
                if (available) params.delete("available");
                else params.set("available", "1");
                params.set("page", "1");
              });
            }}
            className={cn(
              "ml-auto shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition",
              available ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <CheckCircle2 className="mr-1 inline size-3" />
            Available only
          </button>
        </div>
      </header>

      <section className="space-y-4 px-3 pt-2 sm:px-4">
        {isLoading && !data ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-[24px]" />
            <Skeleton className="h-32 w-full rounded-[24px]" />
            <Skeleton className="h-32 w-full rounded-[24px]" />
          </div>
        ) : error ? (
          <div className="rounded-[28px] bg-muted/25 px-6 py-16 text-center">
            <ShoppingBag className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 text-base font-black">Couldn't load listings</h2>
            <p className="mt-2 text-sm text-muted-foreground">Refresh the page and try again.</p>
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="space-y-3">
              {listings.map((item) => (
                <MarketplaceCard
                  key={item.id}
                  item={item}
                  currentUserId={profileId}
                  onDeleted={handleItemDeleted}
                />
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Pagination page={data?.page || page} totalPages={data?.totalPages || 1} />
            </div>

            <p className="pb-2 text-center text-xs font-medium text-muted-foreground">
              Showing {listings.length} of {data?.total || listings.length}
            </p>
          </>
        ) : (
          <div className="rounded-[28px] bg-muted/25 px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-card text-primary shadow-sm">
              <ShoppingBag className="size-7" />
            </div>
            <h2 className="mt-4 text-base font-black">No listings found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {urlSearch
                ? 'Nothing matches "' + urlSearch + '". Try different keywords.'
                : "No items match these filters yet."}
            </p>
            <Link
              href="/buy-and-sell/new"
              className="mt-5 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-extrabold text-primary-foreground shadow-sm active:scale-95"
            >
              <Plus className="size-3.5" />
              List an Item
            </Link>
          </div>
        )}

        {isValidating && data ? (
          <div className="flex items-center justify-center gap-2 pb-2 text-xs font-semibold text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            Updating listings...
          </div>
        ) : null}
      </section>
    </main>
  );
}
