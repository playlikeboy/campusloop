import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { marketplaceOrderItems, marketplaceOrders, merchants, products, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { withUniqueOrderNumber } from "@/lib/marketplace/order-number";
import { type CartItemInput, type FulfillmentType, priceMerchantOrder } from "@/lib/marketplace/pricing";
import { releaseExpiredPaymentHolds } from "@/lib/payments/expire-holds";
import { getRedis } from "@/lib/redis";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** One request may not span more baskets than a person could plausibly have open. */
const MAX_MERCHANT_ORDERS = 5;

interface CheckoutPayload {
  merchantOrders: Array<{
    merchantId: string;
    fulfillmentType: FulfillmentType;
    customerNote?: string;
    paymentMethod?: "COD" | "UPI" | "CAMPUS_PAY" | "RAZORPAY";
    items: CartItemInput[];
  }>;
  deliveryAddress: {
    hostelName?: string;
    roomNumber?: string;
    phone?: string;
    pickupInstructions?: string;
    rentalStartDate?: string;
    rentalEndDate?: string;
    drivingLicenseNumber?: string;
    aadhaarLast4?: string;
  };
}

import { inMemoryIdempotencyCache, type IdempotencyRecord } from "@/lib/idempotency-cache";

async function getIdempotencyRecord(profileId: string, key: string): Promise<IdempotencyRecord | null> {
  const cacheKey = `checkout:idempotency:${profileId}:${key}`;
  const redisClient = getRedis();
  if (redisClient) {
    try {
      const data = await redisClient.get<IdempotencyRecord>(cacheKey);
      if (data) return data;
    } catch {
      // Redis error fallback
    }
  }

  const mem = inMemoryIdempotencyCache.get(cacheKey);
  if (mem && Date.now() - mem.timestamp < 86400000) {
    return mem;
  }
  return null;
}

async function setIdempotencyRecord(profileId: string, key: string, record: IdempotencyRecord): Promise<void> {
  const cacheKey = `checkout:idempotency:${profileId}:${key}`;
  const redisClient = getRedis();
  if (redisClient) {
    try {
      const ttl = record.status === "COMPLETED" ? 86400 : 60;
      await redisClient.set(cacheKey, JSON.stringify(record), { ex: ttl });
    } catch {
      // Redis error fallback
    }
  }

  inMemoryIdempotencyCache.set(cacheKey, record);
}

async function clearIdempotencyRecord(profileId: string, key: string): Promise<void> {
  const cacheKey = `checkout:idempotency:${profileId}:${key}`;
  const redisClient = getRedis();
  if (redisClient) {
    try {
      await redisClient.del(cacheKey);
    } catch {
      // Redis error fallback
    }
  }

  inMemoryIdempotencyCache.delete(cacheKey);
}

export async function POST(req: Request) {
  let idempotencyKeyHeader: string | null = null;
  let currentProfileId: string | null = null;

  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    currentProfileId = profile.id;

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    // ── Idempotency Check ──
    const rawIdempotencyKey =
      req.headers.get("idempotency-key") ||
      req.headers.get("Idempotency-Key") ||
      req.headers.get("x-idempotency-key");

    if (rawIdempotencyKey && rawIdempotencyKey.trim().length > 0) {
      idempotencyKeyHeader = rawIdempotencyKey.trim();
      const existingRecord = await getIdempotencyRecord(profile.id, idempotencyKeyHeader);
      if (existingRecord) {
        if (existingRecord.status === "COMPLETED" && existingRecord.response) {
          return NextResponse.json(existingRecord.response, {
            status: 200,
            headers: { "X-Idempotent-Replay": "true" },
          });
        }
        if (existingRecord.status === "IN_PROGRESS" && Date.now() - existingRecord.timestamp < 30000) {
          return NextResponse.json(
            { error: "Checkout request is already being processed. Please wait." },
            { status: 409 }
          );
        }
      }

      // Mark request as in-progress
      await setIdempotencyRecord(profile.id, idempotencyKeyHeader, {
        status: "IN_PROGRESS",
        timestamp: Date.now(),
      });
    }

    const payload = (await req.json().catch(() => null)) as CheckoutPayload | null;
    if (!payload?.merchantOrders?.length) {
      if (idempotencyKeyHeader && currentProfileId) {
        await clearIdempotencyRecord(currentProfileId, idempotencyKeyHeader);
      }
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (payload.merchantOrders.length > MAX_MERCHANT_ORDERS) {
      if (idempotencyKeyHeader && currentProfileId) {
        await clearIdempotencyRecord(currentProfileId, idempotencyKeyHeader);
      }
      return NextResponse.json({ error: "Too many merchants in one order" }, { status: 400 });
    }

    // ── Phase 1: Server-side pricing for all baskets before writing anything ──
    // Compute all prices strictly from authoritative server-side product and merchant data.
    const validated: Array<{
      merchantId: string;
      categorySlug: string;
      fulfillmentType: FulfillmentType;
      paymentMethod: "COD" | "UPI" | "CAMPUS_PAY" | "RAZORPAY";
      customerNote: string | null;
      dbProducts: any[];
      lines: Array<{
        productId: string;
        productNameSnapshot: string;
        unitPriceSnapshot: number;
        quantity: number;
        selectedOptions: Record<string, string>;
        selectedAddons: Array<{ name: string; price: number }>;
        subtotal: number;
      }>;
      subtotal: number;
      deliveryFee: number;
      total: number;
    }> = [];

    for (const basket of payload.merchantOrders) {
      const merchant = await db.query.merchants.findFirst({
        where: eq(merchants.id, basket.merchantId),
      });

      if (!merchant) {
        if (idempotencyKeyHeader && currentProfileId) {
          await clearIdempotencyRecord(currentProfileId, idempotencyKeyHeader);
        }
        return NextResponse.json({ error: "That store is no longer available." }, { status: 400 });
      }

      // A student may only order from stores on their own campus.
      if (merchant.institutionId !== profile.institutionId) {
        if (idempotencyKeyHeader && currentProfileId) {
          await clearIdempotencyRecord(currentProfileId, idempotencyKeyHeader);
        }
        return NextResponse.json({ error: `${merchant.name} does not serve your campus.` }, { status: 403 });
      }

      const productIds = Array.from(new Set((basket.items ?? []).map((item) => item.productId)));
      if (productIds.length === 0) {
        if (idempotencyKeyHeader && currentProfileId) {
          await clearIdempotencyRecord(currentProfileId, idempotencyKeyHeader);
        }
        return NextResponse.json({ error: "This order has no items." }, { status: 400 });
      }

      const dbProducts = await db.query.products.findMany({
        where: and(inArray(products.id, productIds), eq(products.merchantId, merchant.id)),
      });

      const result = priceMerchantOrder({
        merchant,
        products: dbProducts,
        items: basket.items,
        fulfillmentType: basket.fulfillmentType,
      });

      if (!result.ok) {
        if (idempotencyKeyHeader && currentProfileId) {
          await clearIdempotencyRecord(currentProfileId, idempotencyKeyHeader);
        }
        return NextResponse.json(
          { error: result.message, code: result.code, merchantId: merchant.id },
          { status: 409 }
        );
      }

      validated.push({
        merchantId: merchant.id,
        categorySlug: merchant.categorySlug,
        fulfillmentType: basket.fulfillmentType,
        paymentMethod: (["COD", "UPI", "CAMPUS_PAY", "RAZORPAY"] as const).includes(
          basket.paymentMethod as "COD"
        )
          ? (basket.paymentMethod as "COD" | "UPI" | "CAMPUS_PAY" | "RAZORPAY")
          : "COD",
        customerNote: basket.customerNote?.trim() || null,
        dbProducts,
        ...result.order,
      });
    }

    // Free stock held by abandoned online payments before reserving new stock.
    await releaseExpiredPaymentHolds();

    // ── Phase 2: Atomic Stock Reservation ──
    //
    // For each product with tracked stock, perform atomic decrement:
    // UPDATE products SET stockQuantity = stockQuantity - requested WHERE id = ? AND merchant_id = ? AND stockQuantity >= requested
    // Verify affected row count. If insufficient, abort checkout, rollback all reservations, and return stock conflict.
    interface ReservedStock {
      productId: string;
      merchantId: string;
      quantity: number;
    }
    const reservedStocks: ReservedStock[] = [];

    for (const basket of validated) {
      for (const line of basket.lines) {
        const prod = basket.dbProducts.find((p) => p.id === line.productId);
        // If product tracks inventory (stockQuantity is not null), reserve stock atomically
        if (prod && prod.stockQuantity !== null) {
          const updated = await db
            .update(products)
            .set({ stockQuantity: sql`${products.stockQuantity} - ${line.quantity}` })
            .where(
              and(
                eq(products.id, line.productId),
                eq(products.merchantId, basket.merchantId),
                sql`${products.stockQuantity} IS NOT NULL`,
                sql`${products.stockQuantity} >= ${line.quantity}`
              )
            )
            .returning({ id: products.id, stockQuantity: products.stockQuantity });

          if (!updated || updated.length === 0) {
            // Stock reservation failed! Rollback all previously reserved items
            for (const reserved of reservedStocks) {
              await db
                .update(products)
                .set({ stockQuantity: sql`${products.stockQuantity} + ${reserved.quantity}` })
                .where(
                  and(
                    eq(products.id, reserved.productId),
                    eq(products.merchantId, reserved.merchantId)
                  )
                )
                .catch(() => {});
            }

            if (idempotencyKeyHeader && currentProfileId) {
              await clearIdempotencyRecord(currentProfileId, idempotencyKeyHeader);
            }

            return NextResponse.json(
              {
                error: `Insufficient stock for "${line.productNameSnapshot}". Please adjust quantity.`,
                code: "STOCK_CONFLICT",
                productId: line.productId,
              },
              { status: 409 }
            );
          }

          reservedStocks.push({
            productId: line.productId,
            merchantId: basket.merchantId,
            quantity: line.quantity,
          });
        }
      }
    }

    // ── Phase 3: Atomic Order & Item Creation ──
    // All merchant orders must succeed or all are rolled back along with stock reservations.
    const createdOrderIds: string[] = [];

    try {
      for (const basket of validated) {
        const newOrder = await withUniqueOrderNumber(async (orderNumber) => {
          const [row] = await db
            .insert(marketplaceOrders)
            .values({
              orderNumber,
              studentId: profile.id,
              merchantId: basket.merchantId,
              institutionId: profile.institutionId,
              categorySlug: basket.categorySlug,
              fulfillmentType: basket.fulfillmentType,
              // Online orders stay hidden from the store until Razorpay confirms payment.
              status: basket.paymentMethod === "RAZORPAY" ? "PAYMENT_PENDING" : "PLACED",
              subtotal: basket.subtotal,
              deliveryFee: basket.deliveryFee,
              discount: 0,
              total: basket.total,
              paymentStatus: basket.paymentMethod === "COD" ? "COD" : "PENDING",
              paymentMethod: basket.paymentMethod,
              customerNote: basket.customerNote,
              deliveryAddress: payload.deliveryAddress,
            })
            .returning();
          return row;
        });

        createdOrderIds.push(newOrder.id);

        // One multi-value insert rather than a statement per line.
        await db.insert(marketplaceOrderItems).values(
          basket.lines.map((line) => ({
            orderId: newOrder.id,
            productId: line.productId,
            productNameSnapshot: line.productNameSnapshot,
            unitPriceSnapshot: line.unitPriceSnapshot,
            quantity: line.quantity,
            selectedOptions: line.selectedOptions,
            selectedAddons: line.selectedAddons,
            subtotal: line.subtotal,
          }))
        );
      }
    } catch (writeError) {
      // Rollback any orders created so far
      if (createdOrderIds.length > 0) {
        await db
          .delete(marketplaceOrders)
          .where(inArray(marketplaceOrders.id, createdOrderIds))
          .catch(() => {});
      }

      // Rollback all reserved stock
      for (const reserved of reservedStocks) {
        await db
          .update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} + ${reserved.quantity}` })
          .where(
            and(
              eq(products.id, reserved.productId),
              eq(products.merchantId, reserved.merchantId)
            )
          )
          .catch(() => {});
      }

      if (idempotencyKeyHeader && currentProfileId) {
        await clearIdempotencyRecord(currentProfileId, idempotencyKeyHeader);
      }

      throw writeError;
    }

    const responsePayload = {
      success: true,
      orderIds: createdOrderIds,
      primaryOrderId: createdOrderIds[0],
    };

    // Save completed result to idempotency store
    if (idempotencyKeyHeader && currentProfileId) {
      await setIdempotencyRecord(currentProfileId, idempotencyKeyHeader, {
        status: "COMPLETED",
        response: responsePayload,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    if (idempotencyKeyHeader && currentProfileId) {
      await clearIdempotencyRecord(currentProfileId, idempotencyKeyHeader).catch(() => {});
    }
    console.error("Error creating marketplace orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
