"use client";

import { Bike, BookOpen, Compass, Home, Laptop, Plus, ShoppingBag, Tag, Wind } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { MarketplaceCard } from "@/components/communities/marketplace-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetcher } from "@/lib/api";
import { FilterSheet } from "../living/_components/filter-sheet";
import { ChipRow, HubLayout, HubSearch } from "../living/_components/hub-layout";
import { HubResults } from "../living/_components/hub-results";
import { useHubQuery } from "../living/_components/use-hub-query";

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
  { id: "all", label: "All", icon: ShoppingBag },
  { id: "Cycles", label: "Cycles", icon: Bike },
  { id: "Textbooks", label: "Books and notes", icon: BookOpen },
  { id: "Coolers", label: "Coolers and fans", icon: Wind },
  { id: "Electronics", label: "Electronics", icon: Laptop },
  { id: "Lab Coats", label: "Drafters and lab gear", icon: Compass },
  { id: "Furniture", label: "Mattresses and furniture", icon: Home },
  { id: "Other", label: "Other", icon: Tag },
] as const;

const PRICE_FILTERS = [
  { id: "all", label: "Any price" },
  { id: "under_500", label: "Under ₹500" },
  { id: "500_2000", label: "₹500 to ₹2,000" },
  { id: "above_2000", label: "Over ₹2,000" },
] as const;

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
] as const;

export function BuyAndSellClient({ profileId }: Props) {
  const { searchParams, urlSearch, page, searchQuery, setSearchQuery, updateUrl, setParam, clearParams } =
    useHubQuery();

  const category = searchParams.get("category") || "all";
  const price = searchParams.get("price") || "all";
  const available = searchParams.get("available") === "1";
  const sort = searchParams.get("sort") || "newest";

  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams({ tab: "buy-and-sell", page: String(page), limit: "18" });
    if (urlSearch) params.set("q", urlSearch);
    if (category !== "all") params.set("category", category);
    if (price !== "all") params.set("price", price);
    if (available) params.set("available", "1");
    if (sort !== "newest") params.set("sort", sort);
    return `/api/communities/feed?${params.toString()}`;
  }, [available, category, page, price, sort, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<FeedResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const listings = useMemo(() => {
    const list = (data?.items || [])
      .filter((item) => item.itemType === "MARKETPLACE" && item.data)
      .map((item) => item.data)
      .filter((item) => !deletedIds[item.id]);
    // The API may not sort by price, so sort the page here too.
    if (sort === "price_asc") return list.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return list.sort((a, b) => b.price - a.price);
    return list;
  }, [data?.items, deletedIds, sort]);

  function handleItemDeleted(itemId: string) {
    setDeletedIds((prev) => ({ ...prev, [itemId]: true }));
    void mutate();
  }

  const hasFilters = Boolean(urlSearch) || category !== "all" || price !== "all" || available;
  const sellButton = (
    <Button asChild>
      <Link href="/buy-and-sell/new">
        <Plus className="size-4" aria-hidden="true" />
        Sell something
      </Link>
    </Button>
  );

  return (
    <HubLayout
      title="Buy and sell"
      description="Second-hand books, cycles and hostel stuff from students at your college."
      action={{ href: "/buy-and-sell/new", label: "Sell" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <HubSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search cycles, books, coolers"
          label="Search listings"
          className="basis-full sm:basis-auto"
        />
        <FilterSheet
          title="Filter listings"
          groups={[{ key: "price", label: "Price", value: price, options: PRICE_FILTERS }]}
          toggle={{ key: "available", label: "Hide sold items", checked: available }}
          onChange={(key, value) => setParam(key, value)}
          onToggle={(key, checked) =>
            updateUrl((params) => {
              if (checked) params.set(key, "1");
              else params.delete(key);
              params.set("page", "1");
            })
          }
          onClear={() => clearParams(["price", "available"])}
        />
        <Select value={sort} onValueChange={(value) => setParam("sort", String(value), "newest")}>
          <SelectTrigger aria-label="Sort listings" className="w-auto min-w-40 flex-1 sm:flex-none">
            <SelectValue>{SORTS.find((s) => s.id === sort)?.label ?? "Newest"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChipRow label="Category">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Chip
              key={cat.id}
              size="sm"
              selected={category === cat.id}
              icon={<Icon aria-hidden="true" />}
              onClick={() => setParam("category", cat.id)}
            >
              {cat.label}
            </Chip>
          );
        })}
      </ChipRow>

      <HubResults
        isLoading={isLoading && !data}
        error={error}
        onRetry={() => void mutate()}
        noun="listings"
        count={listings.length}
        isValidating={isValidating && Boolean(data)}
        page={data?.page || page}
        totalPages={data?.totalPages || 1}
        skeletonClassName="h-72"
        empty={{
          icon: ShoppingBag,
          title: hasFilters ? "Nothing matches that" : "Nothing for sale yet",
          description: hasFilters
            ? "Try a different word or clear the filters."
            : "Got old books or a cycle you don't use? Sell it here.",
          action: hasFilters ? (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery("");
                clearParams(["q", "category", "price", "available"]);
              }}
            >
              Clear search and filters
            </Button>
          ) : (
            sellButton
          ),
        }}
      >
        {listings.map((item) => (
          <MarketplaceCard
            key={item.id}
            item={item}
            currentUserId={profileId}
            onDeleted={handleItemDeleted}
          />
        ))}
      </HubResults>
    </HubLayout>
  );
}
