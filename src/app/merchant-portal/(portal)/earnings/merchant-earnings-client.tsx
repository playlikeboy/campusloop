"use client";

import { IndianRupee } from "lucide-react";
import useSWR from "swr";
import { LoadError } from "@/components/merchant/load-error";
import {
  MerchantListSkeleton,
  MerchantPage,
  MerchantSectionTitle,
} from "@/components/merchant/merchant-page";
import { rupees } from "@/components/merchant/merchant-utils";
import type { MerchantOrder } from "@/components/merchant/orders/order-types";
import { StatList } from "@/components/merchant/stat-list";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher } from "@/lib/api";

const DONE = new Set(["DELIVERED", "PICKED_UP", "COMPLETED"]);

export function MerchantEarningsClient() {
  const { data, error, isLoading, mutate } = useSWR<{ orders: MerchantOrder[] }>(
    "/api/merchant/orders?status=all",
    fetcher
  );

  const done = (data?.orders || []).filter((o) => DONE.has(o.status));
  const sum = (list: MerchantOrder[], pick: (o: MerchantOrder) => number) =>
    list.reduce((s, o) => s + pick(o), 0);
  // Order totals already include the delivery fee, so it is shown as part of sales, not added again.
  const total = sum(done, (o) => o.total || 0);
  const deliveryFees = sum(done, (o) => o.deliveryFee || 0);
  const upi = sum(
    done.filter((o) => o.paymentMethod === "UPI"),
    (o) => o.total || 0
  );
  const cash = sum(
    done.filter((o) => o.paymentMethod === "COD"),
    (o) => o.total || 0
  );

  return (
    <MerchantPage title="Earnings" description="Money from orders that are delivered or picked up.">
      {isLoading ? (
        <MerchantListSkeleton rows={2} />
      ) : error ? (
        <LoadError what="your earnings" onRetry={mutate} />
      ) : done.length === 0 ? (
        <EmptyState
          bordered
          icon={IndianRupee}
          title="No earnings yet"
          description="Finished orders add up here."
        />
      ) : (
        <>
          <StatList
            items={[
              { label: "Total sales", value: rupees(total) },
              { label: "Finished orders", value: done.length },
              { label: "Paid by UPI", value: rupees(upi) },
              { label: "Cash collected", value: rupees(cash) },
            ]}
          />
          <section className="space-y-3">
            <MerchantSectionTitle>Breakdown</MerchantSectionTitle>
            <dl className="divide-y divide-border rounded-lg border border-border bg-surface text-sm">
              <div className="flex justify-between gap-3 px-4 py-3">
                <dt className="text-fg-muted">Food and items</dt>
                <dd className="tabular-nums text-fg">{rupees(total - deliveryFees)}</dd>
              </div>
              <div className="flex justify-between gap-3 px-4 py-3">
                <dt className="text-fg-muted">Delivery fees</dt>
                <dd className="tabular-nums text-fg">{rupees(deliveryFees)}</dd>
              </div>
              <div className="flex justify-between gap-3 px-4 py-3 font-semibold">
                <dt className="text-fg">Total</dt>
                <dd className="tabular-nums text-fg">{rupees(total)}</dd>
              </div>
            </dl>
          </section>
        </>
      )}
    </MerchantPage>
  );
}
