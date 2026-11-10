"use client";

import { ChevronRight, Receipt, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { formatTimeAgo } from "@/lib/utils";
import { orderStatusLabel, orderStatusVariant } from "./order-status";

type Filter = "all" | "active" | "completed" | "cancelled";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

interface OrdersListProps {
  title: string;
  backHref: string;
  /** Sent to the API as `category`. */
  category?: string;
  /** Extra client-side filter on the returned orders. */
  include?: (order: any) => boolean;
  refreshInterval?: number;
  emptyTitle: string;
  emptyHref: string;
  emptyAction: string;
}

/** Shared order history list for the marketplace (all, food, mart). */
export function OrdersList({
  title,
  backHref,
  category,
  include,
  refreshInterval,
  emptyTitle,
  emptyHref,
  emptyAction,
}: OrdersListProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const key = `/api/marketplace/orders?filter=${filter}${category ? `&category=${category}` : ""}`;
  const { data, isLoading, error } = useSWR<{ orders: any[] }>(key, fetcher, {
    dedupingInterval: 10000,
    refreshInterval,
  });
  const all = data?.orders || [];
  const orders = include ? all.filter(include) : all;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-24">
      <PageHeader title={title} backHref={backHref} size="md" divider={false} />
      <SegmentedControl
        options={FILTERS}
        value={filter}
        onChange={(v: Filter) => {
          sounds.tap();
          haptics.light();
          setFilter(v);
        }}
        fullWidth
      />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading orders">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Receipt}
          title="Couldn't load your orders"
          description="Check your internet and try again."
          action={
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={buttonVariants({ variant: "outline" })}
            >
              Try again
            </button>
          }
        />
      ) : orders.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/marketplace/order/${order.id}`}
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className="group flex items-center gap-3 p-4 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted text-fg-muted">
                  {order.merchant?.logoUrl ? (
                    <img
                      src={order.merchant.logoUrl}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Store className="size-5" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-sans text-sm font-semibold text-fg">
                      {order.merchant?.name || "Store"}
                    </h3>
                    <span className="shrink-0 text-xs text-fg-subtle tabular-nums">#{order.orderNumber}</span>
                  </div>
                  <p className="line-clamp-1 text-sm text-fg-muted">
                    {(order.items || [])
                      .map((i: any) => `${i.quantity}× ${i.productNameSnapshot ?? i.name ?? "Item"}`)
                      .join(", ")}
                  </p>
                  <p className="text-xs text-fg-muted tabular-nums">
                    <span className="font-semibold text-fg">
                      ₹{Number(order.total || 0).toLocaleString("en-IN")}
                    </span>
                    {" · "}
                    {formatTimeAgo(new Date(order.createdAt))}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge variant={orderStatusVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
                  <ChevronRight className="size-4 text-fg-subtle" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Receipt}
          title={emptyTitle}
          description="Your orders and bookings show up here."
          action={
            <Link href={emptyHref} className={buttonVariants({ variant: "primary" })}>
              {emptyAction}
            </Link>
          }
        />
      )}
    </div>
  );
}
