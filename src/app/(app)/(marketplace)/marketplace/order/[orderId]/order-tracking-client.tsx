"use client";

import { MapPin, Phone, Receipt, Store } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { BillSummary } from "@/components/marketplace/bill-summary";
import { OrderPayNow } from "@/components/marketplace/order-pay-now";
import { orderStatusLabel, orderStatusVariant } from "@/components/marketplace/order-status";
import { StatusTimeline } from "@/components/marketplace/status-timeline";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";

interface OrderTrackingClientProps {
  orderId: string;
}

const DELIVERY_STEPS = [
  { key: "PLACED", label: "Order placed", desc: "Waiting for the store to accept" },
  { key: "ACCEPTED", label: "Accepted", desc: "The store has your order" },
  { key: "PREPARING", label: "Preparing", desc: "Your order is being made" },
  { key: "READY", label: "Packed", desc: "Waiting for delivery" },
  { key: "OUT_FOR_DELIVERY", label: "On the way", desc: "Coming to your hostel" },
  { key: "DELIVERED", label: "Delivered", desc: "Enjoy" },
];

const PICKUP_STEPS = [
  { key: "PLACED", label: "Order placed", desc: "Waiting for the store to accept" },
  { key: "ACCEPTED", label: "Accepted", desc: "The store has your order" },
  { key: "PREPARING", label: "Preparing", desc: "Your order is being made" },
  { key: "READY_FOR_PICKUP", label: "Ready for pickup", desc: "Collect it at the counter" },
  { key: "PICKED_UP", label: "Picked up", desc: "All done" },
];

const PAYMENT_LABEL: Record<string, string> = {
  RAZORPAY: "Paid online",
  COD: "Cash",
  UPI: "UPI",
};

export function OrderTrackingClient({ orderId }: OrderTrackingClientProps) {
  const { data, isLoading, error, mutate } = useSWR<{ order: any }>(
    `/api/marketplace/orders/${orderId}`,
    fetcher,
    {
      refreshInterval: 5000,
    }
  );
  const order = data?.order;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4" aria-busy="true" aria-label="Loading order">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={Receipt}
        title={error ? "Couldn't load this order" : "Order not found"}
        description={
          error ? "Check your internet and try again." : "It may have been removed, or the link is wrong."
        }
        action={
          <Link href="/marketplace/orders" className={buttonVariants({ variant: "primary" })}>
            See your orders
          </Link>
        }
      />
    );
  }

  const isPickup = order.fulfillmentType === "PICKUP";
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const isRejected = order.status === "REJECTED" || order.status === "CANCELLED";
  const paymentLabel =
    order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PAID"
      ? "Online, not paid yet"
      : (PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod);

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        description={`${order.merchant?.name ?? "Store"} · ${formatTimeAgo(order.createdAt)}`}
        backHref="/marketplace/orders"
        backLabel="Back to orders"
        size="md"
        secondaryActions={
          <Badge variant={orderStatusVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
        }
      />

      {order.status === "PAYMENT_PENDING" && order.paymentStatus !== "PAID" && (
        <OrderPayNow
          orderId={order.id}
          total={order.total}
          phone={order.deliveryAddress?.phone}
          onPaid={() => mutate()}
        />
      )}

      <section aria-label="Order progress" className="rounded-lg border border-border bg-surface p-4">
        {isRejected ? (
          <div className="space-y-1">
            <p className="text-base font-semibold text-danger">
              {order.status === "REJECTED"
                ? "The store couldn't take this order"
                : "This order was cancelled"}
            </p>
            {order.rejectionReason && (
              <p className="text-sm text-fg-muted">Reason: {order.rejectionReason}</p>
            )}
          </div>
        ) : (
          <StatusTimeline steps={steps} current={order.status} />
        )}
      </section>

      <section
        aria-label="Store"
        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
      >
        <Link
          href={`/marketplace/store/${order.merchantId}`}
          className="flex min-w-0 items-center gap-3 hover:underline"
        >
          <Store className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-fg">{order.merchant?.name}</span>
            {order.merchant?.address && (
              <span className="block truncate text-sm text-fg-muted">{order.merchant.address}</span>
            )}
          </span>
        </Link>
        {order.merchant?.phone && (
          <a
            href={`tel:${order.merchant.phone}`}
            aria-label={`Call ${order.merchant?.name ?? "the store"}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <Phone className="size-4" />
          </a>
        )}
      </section>

      <section aria-labelledby="order-items-title" className="rounded-lg border border-border bg-surface p-4">
        <h2 id="order-items-title" className="mb-2 font-sans text-base font-semibold text-fg">
          Items
        </h2>
        <ul className="divide-y divide-border">
          {(order.items || []).map((item: any) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="text-fg">
                  {item.quantity} × {item.productNameSnapshot}
                </p>
                {item.selectedAddons && item.selectedAddons.length > 0 && (
                  <p className="text-xs text-fg-muted">
                    + {item.selectedAddons.map((a: any) => a.name).join(", ")}
                  </p>
                )}
              </div>
              <span className="text-fg tabular-nums">
                ₹{Number(item.subtotal || 0).toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <BillSummary
        lines={[
          { label: "Items", amount: Number(order.subtotal || 0) },
          { label: "Delivery", amount: Number(order.deliveryFee || 0), freeWhenZero: true },
        ]}
        total={Number(order.total || 0)}
        totalLabel={`Total · ${paymentLabel}`}
      />

      {order.deliveryAddress &&
        (order.deliveryAddress.hostelName || order.deliveryAddress.phone || order.customerNote) && (
          <section
            aria-label="Delivery details"
            className="space-y-1.5 rounded-lg border border-border bg-surface p-4 text-sm"
          >
            {order.deliveryAddress.hostelName && (
              <p className="flex items-center gap-2 text-fg">
                <MapPin className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
                {order.deliveryAddress.hostelName}
                {order.deliveryAddress.roomNumber ? `, room ${order.deliveryAddress.roomNumber}` : ""}
              </p>
            )}
            {order.deliveryAddress.phone && (
              <p className="flex items-center gap-2 text-fg-muted">
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                {order.deliveryAddress.phone}
              </p>
            )}
            {order.customerNote && <p className="text-fg-muted">Your note: {order.customerNote}</p>}
          </section>
        )}
    </div>
  );
}
