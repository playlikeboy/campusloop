import type { BadgeVariant } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  PAYMENT_PENDING: "Payment pending",
  PLACED: "Placed",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
  PICKED_UP: "Picked up",
  REJECTED: "Rejected by store",
  CANCELLED: "Cancelled",
};

/** Plain words for an order status. */
export function orderStatusLabel(status: string): string {
  return (
    LABELS[status] ??
    status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

/** Badge colour by meaning: done = success, failed = danger, waiting on you = warning, in progress = neutral. */
export function orderStatusVariant(status: string): BadgeVariant {
  if (status === "DELIVERED" || status === "PICKED_UP") return "success";
  if (status === "REJECTED" || status === "CANCELLED") return "danger";
  if (status === "PAYMENT_PENDING") return "warning";
  return "neutral";
}
