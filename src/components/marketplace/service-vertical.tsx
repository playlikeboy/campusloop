"use client";

import type * as React from "react";
import useSWR from "swr";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplaceCart } from "@/hooks/use-marketplace-cart";
import { fetcher } from "@/lib/api";
import { MarketplaceCartBar } from "./cart-bar";
import { MarketplaceLaunchNotice } from "./launch-notice";
import { type MarketplaceProduct, ProductRow } from "./product-row";
import { StoreRow, type StoreRowData } from "./store-row";

interface ServiceVerticalProps {
  /** API category slug. */
  category: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  collegeName?: string;
  /** Section heading over the price list. */
  listTitle: string;
  addLabel?: string;
  /** Shown under the list, e.g. how payment works. */
  footnote?: string;
  children?: React.ReactNode;
}

type Store = StoreRowData & { deliveryFee?: number | null };

/** Shared page for simple services (barber, laundry, water): shops, then a price list you add to the cart. */
export function ServiceVertical({
  category,
  title,
  description,
  icon: Icon,
  collegeName,
  listTitle,
  addLabel,
  footnote,
  children,
}: ServiceVerticalProps) {
  const { totalItemsCount, overallSubtotal } = useMarketplaceCart();
  const {
    data: storesData,
    isLoading: storesLoading,
    error: storesError,
  } = useSWR<{ stores: Store[] }>(`/api/marketplace/stores?category=${category}`, fetcher, {
    dedupingInterval: 10000,
  });
  const { data: productsData, isLoading: productsLoading } = useSWR<{ products: MarketplaceProduct[] }>(
    `/api/marketplace/products?category=${category}&limit=20`,
    fetcher,
    { dedupingInterval: 10000 }
  );

  const stores = storesData?.stores || [];
  const products = productsData?.products || [];
  const feeFor = (merchantId: string) => stores.find((s) => s.id === merchantId)?.deliveryFee ?? undefined;
  const loading = storesLoading || productsLoading;
  const nothing = !loading && stores.length === 0 && products.length === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <PageHeader title={title} description={description} size="md" />

      {children}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label={`Loading ${title.toLowerCase()}`}>
          {[0, 1, 2].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <Skeleton className="size-16 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : storesError ? (
        <EmptyState
          icon={Icon}
          title="Couldn't load this page"
          description="Check your internet and pull down to refresh."
        />
      ) : nothing ? (
        <div className="space-y-4">
          <EmptyState icon={Icon} title={`No ${title.toLowerCase()} shops here yet`} size="compact" />
          <MarketplaceLaunchNotice collegeName={collegeName} />
        </div>
      ) : (
        <>
          {stores.length > 0 && (
            <section aria-labelledby={`${category}-shops`} className="space-y-1">
              <h2 id={`${category}-shops`} className="font-sans text-base font-semibold text-fg">
                {stores.length === 1 ? "Shop" : "Shops"}
              </h2>
              <ul className="-mx-3">
                {stores.map((s) => (
                  <StoreRow key={s.id} store={s} />
                ))}
              </ul>
            </section>
          )}

          {products.length > 0 && (
            <section aria-labelledby={`${category}-prices`}>
              <h2 id={`${category}-prices`} className="font-sans text-base font-semibold text-fg">
                {listTitle}
              </h2>
              <ul className="divide-y divide-border">
                {products.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    showStore={stores.length > 1}
                    deliveryFee={feeFor(p.merchantId)}
                    addLabel={addLabel}
                  />
                ))}
              </ul>
              {footnote && <p className="pt-2 text-sm text-fg-muted">{footnote}</p>}
            </section>
          )}
        </>
      )}

      <MarketplaceCartBar count={totalItemsCount} total={overallSubtotal} />
    </div>
  );
}
