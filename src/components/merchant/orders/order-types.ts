export interface MerchantOrderItem {
  id: string;
  productNameSnapshot: string;
  unitPriceSnapshot?: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  selectedAddons?: Array<{ name: string; price: number }>;
  subtotal: number;
}

export interface MerchantOrder {
  id: string;
  orderNumber: string;
  fulfillmentType: "DELIVERY" | "PICKUP" | "BOOKING" | string;
  status: string;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  paymentStatus?: string;
  paymentMethod?: string;
  customerNote?: string | null;
  rejectionReason?: string | null;
  deliveryAddress?: {
    hostelName?: string;
    roomNumber?: string;
    phone?: string;
    pickupInstructions?: string;
  } | null;
  student?: { id: string; username: string; displayName: string; avatarUrl?: string | null } | null;
  items?: MerchantOrderItem[];
  createdAt: string;
}

export type OrderFlow = "food" | "mart";

export type OrderStep = { status: string; label: string };

/** The one next step for an order, or null when nothing is left to do. */
export function nextOrderStep(order: MerchantOrder, flow: OrderFlow = "food"): OrderStep | null {
  const delivery = order.fulfillmentType === "DELIVERY";
  switch (order.status) {
    case "PLACED":
      return { status: "PREPARING", label: flow === "mart" ? "Accept and pack" : "Accept order" };
    case "ACCEPTED":
    case "PREPARING":
      if (flow === "mart") return { status: "READY", label: "Packed" };
      return delivery
        ? { status: "OUT_FOR_DELIVERY", label: "Send for delivery" }
        : { status: "READY_FOR_PICKUP", label: "Ready for pickup" };
    case "READY":
      return delivery
        ? { status: "OUT_FOR_DELIVERY", label: "Send for delivery" }
        : { status: "PICKED_UP", label: "Picked up" };
    case "READY_FOR_PICKUP":
      return { status: "PICKED_UP", label: "Picked up" };
    case "OUT_FOR_DELIVERY":
      return { status: "DELIVERED", label: "Delivered" };
    default:
      return null;
  }
}

export function paymentLabel(method?: string): string {
  if (method === "COD") return "Cash on delivery";
  if (method === "UPI") return "Paid by UPI";
  return method ? "Paid online" : "";
}

export function itemCount(order: MerchantOrder): number {
  return (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
}

/** Plain-text summary a delivery person can read on WhatsApp. */
export function orderSummaryText(order: MerchantOrder): string {
  const items = (order.items || [])
    .map((i) => {
      const extras = i.selectedAddons?.length ? ` (+ ${i.selectedAddons.map((a) => a.name).join(", ")})` : "";
      return `- ${i.quantity} x ${i.productNameSnapshot}${extras}`;
    })
    .join("\n");
  const addr = order.deliveryAddress;
  const place = [addr?.hostelName || "Campus", addr?.roomNumber ? `Room ${addr.roomNumber}` : ""]
    .filter(Boolean)
    .join(", ");
  return [
    `Order #${order.orderNumber}`,
    `Name: ${order.student?.displayName || "Student"}`,
    `Place: ${place}`,
    `Phone: ${addr?.phone || "not given"}`,
    `Total: ₹${order.total} (${paymentLabel(order.paymentMethod) || "payment not set"})`,
    order.customerNote ? `Note: ${order.customerNote}` : "",
    "Items:",
    items,
  ]
    .filter(Boolean)
    .join("\n");
}
