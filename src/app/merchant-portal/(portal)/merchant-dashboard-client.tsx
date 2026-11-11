"use client";

import { BellRing, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { LoadError } from "@/components/merchant/load-error";
import {
  MerchantListSkeleton,
  MerchantPage,
  MerchantSectionTitle,
} from "@/components/merchant/merchant-page";
import { rupees, storePath } from "@/components/merchant/merchant-utils";
import { OrderCard } from "@/components/merchant/orders/order-card";
import { OrderRow } from "@/components/merchant/orders/order-row";
import type { MerchantOrder } from "@/components/merchant/orders/order-types";
import { useNewOrderAlert } from "@/components/merchant/orders/use-new-order-alert";
import { useOrderActions } from "@/components/merchant/orders/use-order-actions";
import { SoundToggle } from "@/components/merchant/sound-toggle";
import { StatList } from "@/components/merchant/stat-list";
import { StoreOpenSwitch } from "@/components/merchant/store-open-switch";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher } from "@/lib/api";

interface DashboardData {
  merchant: { id: string; name: string; address?: string | null; isOpen?: boolean | null };
  metrics: {
    totalOrders: number;
    activeOrdersCount: number;
    completedOrdersCount: number;
    totalRevenue: number;
    totalProducts: number;
  };
  activeOrders: MerchantOrder[];
  recentOrders: MerchantOrder[];
}

export function MerchantDashboardClient() {
  const [soundOn, setSoundOn] = useState(true);
  const { data, error, isLoading, mutate } = useSWR<DashboardData>("/api/merchant/dashboard", fetcher, {
    refreshInterval: 5000,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });
  const { busyId, advance, reject, rejectDialog } = useOrderActions(mutate);

  const newOrders = (data?.activeOrders || []).filter((o) => o.status === "PLACED");
  useNewOrderAlert(data?.activeOrders, soundOn);

  const merchant = data?.merchant;
  const metrics = data?.metrics;

  return (
    <MerchantPage
      title={merchant?.name || "Your store"}
      description={merchant?.address || undefined}
      primaryAction={
        merchant ? <StoreOpenSwitch isOpen={Boolean(merchant.isOpen)} onChanged={mutate} /> : undefined
      }
      secondaryActions={
        <>
          <SoundToggle enabled={soundOn} onChange={setSoundOn} />
          {merchant?.id && (
            <Button asChild variant="outline">
              <Link href={storePath(merchant.id)} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                View store
              </Link>
            </Button>
          )}
        </>
      }
    >
      {isLoading ? (
        <MerchantListSkeleton rows={3} rowClassName="h-28" />
      ) : error || !data ? (
        <LoadError what="your dashboard" onRetry={mutate} />
      ) : (
        <>
          <StatList
            items={[
              { label: "Total sales", value: rupees(metrics?.totalRevenue) },
              { label: "Orders", value: metrics?.totalOrders ?? 0 },
              {
                label: "In progress",
                value: metrics?.activeOrdersCount ?? 0,
                attention: (metrics?.activeOrdersCount ?? 0) > 0,
              },
              { label: "Menu items", value: metrics?.totalProducts ?? 0 },
            ]}
          />

          <section className="space-y-3">
            <MerchantSectionTitle>
              New orders{newOrders.length > 0 ? ` (${newOrders.length})` : ""}
            </MerchantSectionTitle>
            {newOrders.length > 0 ? (
              <div className="space-y-3">
                {newOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    busy={busyId === order.id}
                    onAdvance={advance}
                    onReject={reject}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                bordered
                size="compact"
                icon={BellRing}
                title="No new orders"
                description="New orders show up here with a sound."
              />
            )}
          </section>

          <section className="space-y-3">
            <MerchantSectionTitle
              action={
                <Button asChild variant="link">
                  <Link href="/merchant-portal/orders">See all orders</Link>
                </Button>
              }
            >
              Recent orders
            </MerchantSectionTitle>
            {data.recentOrders.length > 0 ? (
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
                {data.recentOrders.slice(0, 5).map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-muted">
                No orders yet. Share your store link to get your first one.
              </p>
            )}
          </section>
        </>
      )}
      <p role="status" className="sr-only">
        {newOrders.length > 0 ? `${newOrders.length} new order${newOrders.length === 1 ? "" : "s"}` : ""}
      </p>
      {rejectDialog}
    </MerchantPage>
  );
}
