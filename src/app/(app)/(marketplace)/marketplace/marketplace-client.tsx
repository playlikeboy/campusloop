"use client";

import { Bike, Droplet, Scissors, Search, Shirt, ShoppingBag, Store, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { BikeRow } from "@/components/marketplace/bike-row";
import { MarketplaceCartBar } from "@/components/marketplace/cart-bar";
import { CommunityHubStrip } from "@/components/marketplace/community-hub-strip";
import { type Deal, DealsRow } from "@/components/marketplace/deals-row";
import { MarketplaceLaunchNotice } from "@/components/marketplace/launch-notice";
import { StoreRow, type StoreRowData } from "@/components/marketplace/store-row";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplaceCart } from "@/hooks/use-marketplace-cart";
import { useProfile } from "@/hooks/use-profile";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { isBitMesraCampus } from "@/lib/marketplace/locations";
import { sounds } from "@/lib/sounds";

interface MarketplaceClientProps {
  profileId?: string;
  collegeName?: string;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Store },
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "essentials", label: "Mart", icon: ShoppingBag },
  { id: "rentals", label: "Bike rentals", icon: Bike },
  { id: "barber", label: "Barber", icon: Scissors },
  { id: "laundry", label: "Laundry", icon: Shirt },
  { id: "water", label: "Water", icon: Droplet },
] as const;

type StoreWithOffers = Omit<StoreRowData, "offers"> & {
  offers?: Array<{ id: string; title: string; code?: string | null }>;
};

export function MarketplaceClient({ collegeName }: MarketplaceClientProps) {
  const { profile } = useProfile();
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const { totalItemsCount, overallSubtotal } = useMarketplaceCart();

  const college = profile?.institution?.name || collegeName;
  const isLive = useMemo(
    () =>
      ["bit-mesra", "bitmesra"].includes(profile?.institution?.slug?.toLowerCase() ?? "") ||
      (!!college && isBitMesraCampus(college)),
    [profile, college]
  );

  const { data, isLoading, error } = useSWR<{ stores: StoreWithOffers[] }>(
    `/api/marketplace/stores?category=${category}&q=${encodeURIComponent(query)}`,
    fetcher,
    { dedupingInterval: 10000 }
  );
  const stores = useMemo(() => data?.stores || [], [data]);

  const { data: bikesData } = useSWR<{ bikes: any[] }>(
    category === "rentals" ? "/api/marketplace/rentals/bikes" : null,
    fetcher,
    { dedupingInterval: 10000 }
  );
  const bikes = bikesData?.bikes || [];

  const deals = useMemo<Deal[]>(
    () =>
      stores.flatMap((s) =>
        (s.offers || []).map((o) => ({
          id: o.id,
          title: o.title,
          code: o.code,
          storeId: s.id,
          storeName: s.name,
          storeLogo: s.logoUrl,
        }))
      ),
    [stores]
  );

  function pick(id: string) {
    sounds.tap();
    haptics.light();
    setCategory(id);
  }

  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl text-fg sm:text-3xl">Marketplace</h1>
          <Badge variant="neutral">Beta</Badge>
        </div>
        <p className="text-sm text-fg-muted">
          Food, essentials and services from shops near {college || "your college"}.
        </p>
      </header>

      {!isLive && <MarketplaceLaunchNotice collegeName={college} />}

      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">Search stores</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores"
            className="pl-11"
          />
        </label>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <Chip key={c.id} selected={category === c.id} onClick={() => pick(c.id)} icon={<Icon />}>
                {c.label}
              </Chip>
            );
          })}
        </div>
      </div>

      {deals.length > 0 && category === "all" && !query && <DealsRow deals={deals} />}

      {category === "rentals" && bikes.length > 0 && (
        <section aria-labelledby="bikes-title" className="space-y-1">
          <h2 id="bikes-title" className="font-sans text-base font-semibold text-fg">
            Bikes you can rent
          </h2>
          <ul className="-mx-3">
            {bikes.map((b) => (
              <BikeRow key={b.id} bike={b} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="stores-title" className="space-y-1">
        <h2 id="stores-title" className="font-sans text-base font-semibold text-fg">
          {category === "all" ? "Stores" : `${categoryLabel} stores`}
          {!isLoading && stores.length > 0 && (
            <span className="ml-1.5 font-normal text-fg-muted tabular-nums">{stores.length}</span>
          )}
        </h2>
        {isLoading ? (
          <div className="space-y-3 pt-2" aria-busy="true" aria-label="Loading stores">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-20 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            size="compact"
            icon={Store}
            title="Couldn't load stores"
            description="Check your internet and pull down to refresh."
          />
        ) : stores.length > 0 ? (
          <ul className="-mx-3">
            {stores.map((store) => (
              <StoreRow key={store.id} store={store} />
            ))}
          </ul>
        ) : (
          <EmptyState
            size="compact"
            icon={Store}
            title={query ? `No stores match "${query}"` : "No stores here yet"}
            description={
              query
                ? "Try a shorter word or pick another service."
                : "Check back soon, or try another service."
            }
          />
        )}
      </section>

      <CommunityHubStrip />

      <MarketplaceCartBar count={totalItemsCount} total={overallSubtotal} />
    </div>
  );
}
