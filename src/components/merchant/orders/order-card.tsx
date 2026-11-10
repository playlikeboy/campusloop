"use client";

import { Copy, MessageCircle, Phone, Store, Truck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo } from "@/lib/utils";
import { copyText, rupees } from "../merchant-utils";
import { StatusBadge } from "../status-badge";
import {
  itemCount,
  type MerchantOrder,
  nextOrderStep,
  type OrderFlow,
  type OrderStep,
  orderSummaryText,
  paymentLabel,
} from "./order-types";

interface OrderCardProps {
  order: MerchantOrder;
  flow?: OrderFlow;
  busy?: boolean;
  onAdvance: (order: MerchantOrder, step: OrderStep) => void;
  onReject: (order: MerchantOrder) => void;
}

export function OrderCard({ order, flow = "food", busy, onAdvance, onReject }: OrderCardProps) {
  const isNew = order.status === "PLACED";
  const step = nextOrderStep(order, flow);
  const addr = order.deliveryAddress;
  const phone = addr?.phone;
  const name = order.student?.displayName || "Student";
  const delivery = order.fulfillmentType === "DELIVERY";
  const place = [addr?.hostelName, addr?.roomNumber ? `Room ${addr.roomNumber}` : null]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      aria-label={`Order ${order.orderNumber}`}
      className={cn(
        "space-y-4 rounded-lg border bg-surface p-4 sm:p-5",
        isNew ? "border-warning" : "border-border"
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold text-fg">#{order.orderNumber}</h3>
            <StatusBadge kind="order" status={order.status} />
          </div>
          <p className="text-sm text-fg-muted">
            {formatTimeAgo(order.createdAt)} · {itemCount(order)} item{itemCount(order) === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-fg">{rupees(order.total)}</p>
          <p className="text-sm text-fg-muted">{paymentLabel(order.paymentMethod)}</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={order.student?.avatarUrl || undefined} alt="" />
          <AvatarFallback className="text-sm font-semibold">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{name}</p>
          <p className="flex items-center gap-1 truncate text-sm text-fg-muted">
            {delivery ? <Truck className="size-3.5 shrink-0" /> : <Store className="size-3.5 shrink-0" />}
            <span className="truncate">
              {delivery ? `Deliver to ${place || "campus"}` : "Pickup at your store"}
            </span>
          </p>
        </div>
        <div className="flex gap-1.5">
          {phone && (
            <Button asChild variant="outline" size="icon" aria-label={`Call ${phone}`}>
              <a href={`tel:${phone}`}>
                <Phone />
              </a>
            </Button>
          )}
          {phone && (
            <Button asChild variant="outline" size="icon" aria-label="Message on WhatsApp">
              <a
                href={`https://wa.me/91${phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                  `Hi ${name}, about your CampusLoop order #${order.orderNumber}:`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle />
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label="Copy order details"
            onClick={() => {
              sounds.tap();
              void copyText(orderSummaryText(order), "Order details copied");
            }}
          >
            <Copy />
          </Button>
        </div>
      </div>

      {order.customerNote && (
        <p className="rounded-md bg-warning-subtle px-3 py-2 text-sm text-fg">
          <span className="font-semibold">Note: </span>
          {order.customerNote}
        </p>
      )}

      <ul className="divide-y divide-border rounded-md border border-border">
        {(order.items || []).map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="text-fg">
                <span className="font-semibold tabular-nums">{item.quantity} ×</span>{" "}
                {item.productNameSnapshot}
              </p>
              {item.selectedAddons && item.selectedAddons.length > 0 && (
                <p className="text-fg-muted">+ {item.selectedAddons.map((a) => a.name).join(", ")}</p>
              )}
            </div>
            <span className="shrink-0 tabular-nums text-fg-muted">{rupees(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      {order.rejectionReason && <p className="text-sm text-danger">Reason: {order.rejectionReason}</p>}

      {(step || isNew) && (
        <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {isNew && (
            <Button variant="ghost" className="text-danger" disabled={busy} onClick={() => onReject(order)}>
              Reject
            </Button>
          )}
          {step && (
            <Button
              loading={busy}
              onClick={() => {
                haptics.light();
                onAdvance(order, step);
              }}
            >
              {step.label}
            </Button>
          )}
        </footer>
      )}
    </article>
  );
}
