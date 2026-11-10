import { formatTimeAgo } from "@/lib/utils";
import { rupees } from "../merchant-utils";
import { StatusBadge } from "../status-badge";
import type { MerchantOrder } from "./order-types";

/** One-line order summary for "recent orders" lists. */
export function OrderRow({ order }: { order: MerchantOrder }) {
  const items = (order.items || []).map((i) => `${i.quantity} × ${i.productNameSnapshot}`).join(", ");
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg">
          <span className="font-semibold">#{order.orderNumber}</span>
          <span className="text-fg-subtle"> · {formatTimeAgo(order.createdAt)}</span>
        </p>
        <p className="truncate text-sm text-fg-muted">{items || "No items"}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-semibold tabular-nums text-fg">{rupees(order.total)}</span>
        <StatusBadge kind="order" status={order.status} />
      </div>
    </li>
  );
}
