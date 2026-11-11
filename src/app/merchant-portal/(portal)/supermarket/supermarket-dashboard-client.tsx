"use client";

import { PackageCheck, Plus } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { LoadError } from "@/components/merchant/load-error";
import {
  MerchantListSkeleton,
  MerchantPage,
  MerchantSectionTitle,
} from "@/components/merchant/merchant-page";
import { rupees } from "@/components/merchant/merchant-utils";
import { OrderCard } from "@/components/merchant/orders/order-card";
import type { MerchantOrder } from "@/components/merchant/orders/order-types";
import { useNewOrderAlert } from "@/components/merchant/orders/use-new-order-alert";
import { useOrderActions } from "@/components/merchant/orders/use-order-actions";
import { StatList } from "@/components/merchant/stat-list";
import { StoreOpenSwitch } from "@/components/merchant/store-open-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher } from "@/lib/api";

interface DashboardData {
  merchant: { id: string; name: string; address?: string | null; isOpen?: boolean | null };
  metrics: { totalRevenue: number; completedOrdersCount: number };
  activeOrders: MerchantOrder[];
}

export function SupermarketDashboardClient() {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>("/api/merchant/dashboard", fetcher, {
    refreshInterval: 6000,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });
  const { data: productsData } = useSWR<{ products: any[] }>("/api/merchant/products", fetcher);
  const { busyId, advance, reject, rejectDialog } = useOrderActions(mutate);
  useNewOrderAlert(data?.activeOrders, true);

  const merchant = data?.merchant;
  const products = productsData?.products || [];
  const outOfStock = products.filter((p) => !p.isAvailable);
  const toPack = data?.activeOrders || [];

  return (
    <MerchantPage
      width="wide"
      title={merchant?.name || "Your mart"}
      description={merchant?.address || undefined}
      primaryAction={
        merchant ? <StoreOpenSwitch isOpen={Boolean(merchant.isOpen)} onChanged={mutate} /> : undefined
      }
      secondaryActions={
        <Button asChild variant="outline">
          <Link href="/merchant-portal/products/new">
            <Plus />
            Add item
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <MerchantListSkeleton rows={3} rowClassName="h-28" />
      ) : error || !data ? (
        <LoadError what="your mart" onRetry={mutate} />
      ) : (
        <>
          <StatList
            items={[
              { label: "Total sales", value: rupees(data.metrics?.totalRevenue) },
              { label: "Orders done", value: data.metrics?.completedOrdersCount ?? 0 },
              { label: "Items", value: products.length },
              { label: "Out of stock", value: outOfStock.length, attention: outOfStock.length > 0 },
            ]}
          />

          <section className="space-y-3">
            <MerchantSectionTitle>
              To pack{toPack.length > 0 ? ` (${toPack.length})` : ""}
            </MerchantSectionTitle>
            {toPack.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {toPack.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    flow="mart"
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
                icon={PackageCheck}
                title="Nothing to pack"
                description="New orders show up here with a sound."
              />
            )}
          </section>

          <section className="space-y-3">
            <MerchantSectionTitle
              action={
                <Button asChild variant="link">
                  <Link href="/merchant-portal/products">All items</Link>
                </Button>
              }
            >
              Stock
            </MerchantSectionTitle>
            {products.length > 0 ? (
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
                {products.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-fg">{p.name}</p>
                      <p className="truncate text-fg-muted">
                        {rupees(p.price)} · {p.categoryName || "General"}
                      </p>
                    </div>
                    <Badge variant={p.isAvailable ? "success" : "danger"}>
                      {p.isAvailable ? "In stock" : "Sold out"}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-muted">No items yet. Add your first one to start selling.</p>
            )}
          </section>
        </>
      )}
      {rejectDialog}
    </MerchantPage>
  );
}
