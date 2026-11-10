import { Badge, type BadgeVariant } from "@/components/ui/badge";

type StatusInfo = { label: string; variant: BadgeVariant };

const ORDER_STATUS: Record<string, StatusInfo> = {
  PLACED: { label: "New", variant: "warning" },
  ACCEPTED: { label: "Accepted", variant: "outline" },
  PREPARING: { label: "Preparing", variant: "outline" },
  READY: { label: "Ready", variant: "outline" },
  READY_FOR_PICKUP: { label: "Ready for pickup", variant: "outline" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", variant: "outline" },
  DELIVERED: { label: "Delivered", variant: "success" },
  PICKED_UP: { label: "Picked up", variant: "success" },
  RETURNED: { label: "Returned", variant: "neutral" },
  REJECTED: { label: "Rejected", variant: "danger" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

const BOOKING_STATUS: Record<string, StatusInfo> = {
  REQUESTED: { label: "Waiting for you", variant: "warning" },
  CONFIRMED: { label: "Approved", variant: "outline" },
  READY_FOR_PICKUP: { label: "Ready for pickup", variant: "outline" },
  ACTIVE: { label: "On a ride", variant: "outline" },
  RETURNED: { label: "Returned", variant: "neutral" },
  COMPLETED: { label: "Done", variant: "success" },
  DISPUTED: { label: "Damage reported", variant: "danger" },
  REJECTED: { label: "Rejected", variant: "danger" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

const BIKE_STATUS: Record<string, StatusInfo> = {
  AVAILABLE: { label: "Available", variant: "success" },
  BOOKED: { label: "Booked", variant: "outline" },
  RENTED: { label: "Rented out", variant: "neutral" },
  MAINTENANCE: { label: "In repair", variant: "danger" },
};

const TABLES = { order: ORDER_STATUS, booking: BOOKING_STATUS, bike: BIKE_STATUS } as const;

function humanize(status: string): string {
  const s = status.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function statusLabel(kind: keyof typeof TABLES, status: string): string {
  return TABLES[kind][status]?.label ?? humanize(status);
}

export function StatusBadge({ kind, status }: { kind: keyof typeof TABLES; status: string }) {
  const info = TABLES[kind][status];
  return <Badge variant={info?.variant ?? "neutral"}>{info?.label ?? humanize(status)}</Badge>;
}
