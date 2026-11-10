"use client";

import { Cookie, Milk, PenTool, Plug, Receipt, ShoppingBag, ShoppingCart, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { MarketplaceCartBar } from "@/components/marketplace/cart-bar";
import { MarketplaceLaunchNotice } from "@/components/marketplace/launch-notice";
import { type MarketplaceProduct, ProductRow } from "@/components/marketplace/product-row";
import { SearchInput } from "@/components/marketplace/search-input";
import { StoreRow, type StoreRowData } from "@/components/marketplace/store-row";
import { buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplaceCart } from "@/hooks/use-marketplace-cart";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface SupermarketMarketplaceClientProps {
  profileId: string;
  collegeName?: string;
}

const AISLES = [
  { id: "all", label: "All", icon: ShoppingCart, words: [] },
  {
    id: "snacks",
    label: "Snacks",
    icon: Cookie,
    words: ["snack", "chips", "biscuit", "namkeen", "chocolate"],
  },
  {
    id: "beverages",
    label: "Drinks",
    icon: Milk,
    words: ["beverage", "drink", "juice", "milk", "soda", "cola"],
  },
  {
    id: "stationery",
    label: "Stationery",
    icon: PenTool,
    words: ["stationery", "pen", "notebook", "register"],
  },
  {
    id: "toiletries",
    label: "Toiletries",
    icon: Sparkles,
    words: ["toiletr", "soap", "shampoo", "toothpaste"],
  },
  { id: "dorm", label: "Room stuff", icon: Plug, words: ["dorm", "bucket", "extension", "bulb", "hanger"] },
] as const;

type MartStore = StoreRowData & { deliveryFee?: number | null; products?: MarketplaceProduct[] };

export function SupermarketMarketplaceClient({ collegeName }: SupermarketMarketplaceClientProps) {
  const [aisle, setAisle] = useState<string>("all");
  const [query, setQuery] = useState("");
  const { totalItemsCount, overallSubtotal } = useMarketplaceCart();

  const { data, isLoading, error } = useSWR<{ stores: MartStore[] }>(
    `/api/marketplace/stores?category=essentials&q=${encodeURIComponent(query)}`,
    fetcher,
    { dedupingInterval: 10000 }
  );
  const stores = useMemo(() => data?.stores || [], [data]);

  const products = useMemo(() => {
    const all = stores.flatMap((s) =>
      (s.products || []).map((p) => ({
        ...p,
        merchantId: s.id,
        merchantName: s.name,
        deliveryFee: s.deliveryFee,
      }))
    );
    const words: readonly string[] = AISLES.find((a) => a.id === aisle)?.words ?? [];
    if (words.length === 0) return all;
    return all.filter((p) => {
      const text =
        `${p.name} ${(p as { categoryName?: string }).categoryName ?? ""} ${p.description ?? ""}`.toLowerCase();
      return words.some((w) => text.includes(w));
    });
  }, [stores, aisle]);

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <PageHeader
        title="Mart"
        description="Snacks, stationery and daily stuff, delivered to your hostel."
        size="md"
        secondaryActions={
          <Link
            href="/marketplace/supermarket/orders"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Receipt className="size-4" />
            Mart orders
          </Link>
        }
      />

      <div className="space-y-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search the mart"
          placeholder="Search notebooks, chips, soap"
        />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {AISLES.map((a) => {
            const Icon = a.icon;
            return (
              <Chip
                key={a.id}
                selected={aisle === a.id}
                icon={<Icon />}
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setAisle(a.id);
                }}
              >
                {a.label}
              </Chip>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading the mart">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={ShoppingBag}
          title="Couldn't load the mart"
          description="Check your internet and pull down to refresh."
        />
      ) : stores.length === 0 && !query ? (
        <div className="space-y-4">
          <EmptyState icon={ShoppingBag} title="No mart shops here yet" size="compact" />
          <MarketplaceLaunchNotice collegeName={collegeName} />
        </div>
      ) : (
        <>
          {stores.length > 0 && (
            <section aria-labelledby="mart-shops" className="space-y-1">
              <h2 id="mart-shops" className="font-sans text-base font-semibold text-fg">
                Shops
              </h2>
              <ul className="-mx-3">
                {stores.map((s) => (
                  <StoreRow key={s.id} store={s} />
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="mart-items">
            <h2 id="mart-items" className="font-sans text-base font-semibold text-fg">
              Items
            </h2>
            {products.length > 0 ? (
              <ul className="divide-y divide-border">
                {products.map((p) => (
                  <ProductRow
                    key={`${p.merchantId}-${p.id}`}
                    product={p}
                    showStore={stores.length > 1}
                    deliveryFee={p.deliveryFee ?? undefined}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                size="compact"
                icon={ShoppingBag}
                title={query ? `Nothing matches "${query}"` : "Nothing in this aisle yet"}
                description="Try another aisle or a shorter word."
              />
            )}
          </section>
        </>
      )}

      <MarketplaceCartBar count={totalItemsCount} total={overallSubtotal} />
    </div>
  );
}
