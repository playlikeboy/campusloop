"use client";

import { Package } from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { LoadError } from "@/components/merchant/load-error";
import { FilterChips, NativeSelect, SearchField } from "@/components/merchant/merchant-filters";
import { MerchantListSkeleton, MerchantPage } from "@/components/merchant/merchant-page";
import { merchantVertical } from "@/components/merchant/merchant-utils";
import { OrderCard } from "@/components/merchant/orders/order-card";
import type { MerchantOrder } from "@/components/merchant/orders/order-types";
import { useNewOrderAlert } from "@/components/merchant/orders/use-new-order-alert";
import { useOrderActions } from "@/components/merchant/orders/use-order-actions";
import { SoundToggle } from "@/components/merchant/sound-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher } from "@/lib/api";

const TABS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready or on the way" },
  { id: "completed", label: "Done" },
  { id: "cancelled", label: "Cancelled" },
] as const;
type TabId = (typeof TABS)[number]["id"];

type SortOption = "newest" | "oldest" | "highest_total" | "delivery_only" | "pickup_only";

const byNewest = (a: MerchantOrder, b: MerchantOrder) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

function matches(o: MerchantOrder, q: string): boolean {
  return Boolean(
    o.orderNumber?.toLowerCase().includes(q) ||
      o.student?.displayName?.toLowerCase().includes(q) ||
      o.student?.username?.toLowerCase().includes(q) ||
      o.deliveryAddress?.hostelName?.toLowerCase().includes(q) ||
      o.deliveryAddress?.roomNumber?.toLowerCase().includes(q) ||
      o.deliveryAddress?.phone?.includes(q) ||
      o.items?.some((i) => i.productNameSnapshot?.toLowerCase().includes(q))
  );
}

export function MerchantOrdersClient() {
  const [tab, setTab] = useState<TabId>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [query, setQuery] = useState("");
  const [soundOn, setSoundOn] = useState(true);

  const { data, error, isLoading, mutate } = useSWR<{
    orders: MerchantOrder[];
    counts: Record<string, number>;
    merchant?: { categorySlug?: string; verticalType?: string };
  }>(`/api/merchant/orders?status=${tab}`, fetcher, {
    refreshInterval: 5000,
    dedupingInterval: 2500,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });
  const { busyId, advance, reject, rejectDialog } = useOrderActions(mutate);
  useNewOrderAlert(data?.orders, soundOn);

  const flow = merchantVertical(data?.merchant) === "mart" ? "mart" : "food";

  const orders = useMemo(() => {
    let list = [...(data?.orders || [])];
    const q = query.toLowerCase().trim();
    if (q) list = list.filter((o) => matches(o, q));
    if (sortBy === "delivery_only") list = list.filter((o) => o.fulfillmentType === "DELIVERY");
    if (sortBy === "pickup_only") list = list.filter((o) => o.fulfillmentType === "PICKUP");
    if (sortBy === "oldest") return list.sort((a, b) => byNewest(b, a));
    if (sortBy === "highest_total") return list.sort((a, b) => b.total - a.total);
    return list.sort(byNewest);
  }, [data?.orders, query, sortBy]);

  return (
    <MerchantPage
      width="wide"
      title="Orders"
      description="Accept new orders and move them along. This page updates on its own."
      secondaryActions={<SoundToggle enabled={soundOn} onChange={setSoundOn} />}
      toolbar={
        <div className="space-y-3">
          <FilterChips label="Order status" tabs={TABS} value={tab} onChange={setTab} counts={data?.counts} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchField
              className="flex-1"
              label="Search orders"
              value={query}
              onChange={setQuery}
              placeholder="Order number, name, hostel or item"
            />
            <NativeSelect
              aria-label="Sort orders"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="sm:w-52"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest_total">Biggest total</option>
              <option value="delivery_only">Delivery only</option>
              <option value="pickup_only">Pickup only</option>
            </NativeSelect>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <MerchantListSkeleton rows={2} rowClassName="h-56" />
      ) : error ? (
        <LoadError what="your orders" onRetry={mutate} />
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              flow={flow}
              busy={busyId === order.id}
              onAdvance={advance}
              onReject={reject}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          bordered
          icon={Package}
          title={query ? "No orders match your search" : "No orders here"}
          description={
            query ? "Try a different word or clear the search." : "New orders show up here with a sound."
          }
        />
      )}
      <p role="status" className="sr-only">
        {data?.counts?.new ? `${data.counts.new} new order${data.counts.new === 1 ? "" : "s"}` : ""}
      </p>
      {rejectDialog}
    </MerchantPage>
  );
}
