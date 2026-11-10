"use client";

import { Coffee, GlassWater, Leaf, Moon, Receipt, Soup, Utensils, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { MarketplaceCartBar } from "@/components/marketplace/cart-bar";
import { MarketplaceLaunchNotice } from "@/components/marketplace/launch-notice";
import { type MarketplaceProduct, ProductRow } from "@/components/marketplace/product-row";
import { SearchInput } from "@/components/marketplace/search-input";
import { StoreRow, type StoreRowData } from "@/components/marketplace/store-row";
import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplaceCart } from "@/hooks/use-marketplace-cart";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface FoodMarketplaceClientProps {
  profileId: string;
  collegeName?: string;
}

const FOOD_TAGS = [
  { id: "all", label: "All", icon: UtensilsCrossed, words: [] },
  { id: "momos", label: "Momos & rolls", icon: Utensils, words: ["momo", "roll"] },
  { id: "thali", label: "Thali", icon: Soup, words: ["thali"] },
  { id: "night", label: "Late night", icon: Moon, words: ["night", "midnight"] },
  { id: "snacks", label: "Maggi & chai", icon: Coffee, words: ["maggi", "chai", "snack"] },
  { id: "desserts", label: "Shakes", icon: GlassWater, words: ["shake", "dessert", "ice cream"] },
] as const;

type FoodStore = StoreRowData & {
  deliveryFee?: number | null;
  products?: Array<{ name: string; isVeg?: boolean | null }>;
};

type ProductsPage = { products: MarketplaceProduct[]; hasMore: boolean };

function press() {
  sounds.tap();
  haptics.light();
}

export function FoodMarketplaceClient({ collegeName }: FoodMarketplaceClientProps) {
  const [tag, setTag] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const { totalItemsCount, overallSubtotal } = useMarketplaceCart();

  const {
    data: storesData,
    isLoading: storesLoading,
    error: storesError,
  } = useSWR<{ stores: FoodStore[] }>(
    `/api/marketplace/stores?category=food&q=${encodeURIComponent(query)}`,
    fetcher,
    { dedupingInterval: 10000 }
  );

  const {
    data: pages,
    isLoading: productsLoading,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite<ProductsPage>(
    (index, prev) => {
      if (prev && !prev.hasMore) return null;
      return `/api/marketplace/products?category=food&isVeg=${vegOnly ? "true" : "false"}&q=${encodeURIComponent(query)}&page=${index + 1}&limit=12`;
    },
    fetcher,
    { dedupingInterval: 10000 }
  );

  const stores = useMemo(() => storesData?.stores || [], [storesData]);
  const products = (pages || []).flatMap((p) => p.products || []);
  const hasMore = pages?.[pages.length - 1]?.hasMore ?? false;
  const feeFor = (id: string) => stores.find((s) => s.id === id)?.deliveryFee ?? undefined;

  const filteredStores = useMemo(
    () =>
      stores.filter((store) => {
        if (vegOnly) {
          const veg =
            store.description?.toLowerCase().includes("pure veg") ||
            store.name?.toLowerCase().includes("veg") ||
            (store.products || []).every((p) => p.isVeg);
          if (!veg) return false;
        }
        const words: readonly string[] = FOOD_TAGS.find((t) => t.id === tag)?.words ?? [];
        if (words.length === 0) return true;
        const text =
          `${store.name} ${store.description ?? ""} ${(store.products || []).map((p) => p.name).join(" ")}`.toLowerCase();
        return words.some((w) => text.includes(w));
      }),
    [stores, vegOnly, tag]
  );

  const noShopsAtAll = !storesLoading && !storesError && stores.length === 0 && !query;

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <PageHeader
        title="Food"
        description="Order from canteens and food stalls near your hostel."
        size="md"
        secondaryActions={
          <Link
            href="/marketplace/food/orders"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Receipt className="size-4" />
            Food orders
          </Link>
        }
      />

      <div className="space-y-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search food"
          placeholder="Search momos, rolls, a canteen"
        />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip
            selected={vegOnly}
            icon={<Leaf />}
            onClick={() => {
              press();
              setVegOnly((v) => !v);
            }}
          >
            Veg only
          </Chip>
          {FOOD_TAGS.map((t) => {
            const Icon = t.icon;
            return (
              <Chip
                key={t.id}
                selected={tag === t.id}
                icon={<Icon />}
                onClick={() => {
                  press();
                  setTag(t.id);
                }}
              >
                {t.label}
              </Chip>
            );
          })}
        </div>
      </div>

      {noShopsAtAll ? (
        <div className="space-y-4">
          <EmptyState icon={UtensilsCrossed} title="No food shops here yet" size="compact" />
          <MarketplaceLaunchNotice collegeName={collegeName} />
        </div>
      ) : (
        <>
          <section aria-labelledby="food-shops" className="space-y-1">
            <h2 id="food-shops" className="font-sans text-base font-semibold text-fg">
              Canteens
              {!storesLoading && filteredStores.length > 0 && (
                <span className="ml-1.5 font-normal text-fg-muted tabular-nums">{filteredStores.length}</span>
              )}
            </h2>
            {storesLoading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Loading canteens">
                {[0, 1].map((n) => (
                  <Skeleton key={n} className="h-20 w-full rounded-md" />
                ))}
              </div>
            ) : storesError ? (
              <EmptyState
                size="compact"
                icon={UtensilsCrossed}
                title="Couldn't load canteens"
                description="Check your internet and pull down to refresh."
              />
            ) : filteredStores.length > 0 ? (
              <ul className="-mx-3">
                {filteredStores.map((s) => (
                  <StoreRow key={s.id} store={s} />
                ))}
              </ul>
            ) : (
              <EmptyState
                size="compact"
                icon={UtensilsCrossed}
                title="No canteens match"
                description="Try another filter or clear your search."
              />
            )}
          </section>

          <section aria-labelledby="food-dishes">
            <h2 id="food-dishes" className="font-sans text-base font-semibold text-fg">
              Dishes
            </h2>
            {productsLoading && products.length === 0 ? (
              <div className="space-y-3 pt-2" aria-busy="true" aria-label="Loading dishes">
                {[0, 1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <ul className="divide-y divide-border">
                  {products.map((p) => (
                    <ProductRow key={p.id} product={p} showStore deliveryFee={feeFor(p.merchantId)} />
                  ))}
                </ul>
                {hasMore && (
                  <div className="flex justify-center pt-3">
                    <Button
                      variant="secondary"
                      loading={isValidating && size > (pages?.length ?? 0)}
                      onClick={() => {
                        press();
                        setSize(size + 1);
                      }}
                    >
                      Show more dishes
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                size="compact"
                icon={Utensils}
                title="No dishes match"
                description="Try another word, or turn off Veg only."
              />
            )}
          </section>
        </>
      )}

      <MarketplaceCartBar count={totalItemsCount} total={overallSubtotal} />
    </div>
  );
}
