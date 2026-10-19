import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { marketplaceOrderItems, marketplaceOrders, products } from "@/db/schema";

/**
 * Unpaid online orders reserve stock at checkout. If payment never completes,
 * release them after HOLD_MINUTES so items go back on sale.
 *
 * There is no cron, so this runs lazily from checkout and listing routes,
 * throttled per isolate. It is idempotent: the status guard in the UPDATE means
 * two isolates racing cannot release the same order twice.
 */
export const HOLD_MINUTES = 30;
export const EXPIRED_REASON = "Payment not completed in time";
const MIN_INTERVAL_MS = 2 * 60 * 1000;
let lastRun = 0;

async function adjustStock(orderIds: string[], direction: 1 | -1): Promise<void> {
  if (orderIds.length === 0) return;
  const db = getDb();
  const items = await db
    .select({ productId: marketplaceOrderItems.productId, quantity: marketplaceOrderItems.quantity })
    .from(marketplaceOrderItems)
    .where(inArray(marketplaceOrderItems.orderId, orderIds));
  for (const item of items) {
    await db
      .update(products)
      .set({
        stockQuantity:
          direction === 1
            ? sql`${products.stockQuantity} + ${item.quantity}`
            : sql`greatest(${products.stockQuantity} - ${item.quantity}, 0)`,
      })
      .where(and(eq(products.id, item.productId), sql`${products.stockQuantity} IS NOT NULL`));
  }
}

export async function releaseExpiredPaymentHolds(force = false): Promise<number> {
  const now = Date.now();
  if (!force && now - lastRun < MIN_INTERVAL_MS) return 0;
  lastRun = now;
  try {
    const db = getDb();
    const expired = await db
      .update(marketplaceOrders)
      .set({ status: "CANCELLED", rejectionReason: EXPIRED_REASON })
      .where(
        and(
          eq(marketplaceOrders.status, "PAYMENT_PENDING"),
          eq(marketplaceOrders.paymentStatus, "PENDING"),
          lt(marketplaceOrders.createdAt, sql`now() - (${HOLD_MINUTES} * interval '1 minute')`)
        )
      )
      .returning({ id: marketplaceOrders.id });
    await adjustStock(
      expired.map((o) => o.id),
      1
    );
    return expired.length;
  } catch (err) {
    console.warn("[payments] releasing expired holds failed:", err);
    return 0;
  }
}

/**
 * A payment can still arrive after its hold expired. Revive those orders so a
 * paying student is never left with a cancelled order, and take the stock back.
 */
export async function reviveExpiredPaidOrders(orderIds: string[]): Promise<void> {
  if (orderIds.length === 0) return;
  const db = getDb();
  const revived = await db
    .update(marketplaceOrders)
    .set({ status: "PLACED", rejectionReason: null })
    .where(
      and(
        inArray(marketplaceOrders.id, orderIds),
        eq(marketplaceOrders.status, "CANCELLED"),
        eq(marketplaceOrders.rejectionReason, EXPIRED_REASON)
      )
    )
    .returning({ id: marketplaceOrders.id });
  await adjustStock(
    revived.map((o) => o.id),
    -1
  );
}
