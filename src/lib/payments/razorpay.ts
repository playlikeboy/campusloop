import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { marketplaceOrders, marketplacePayments } from "@/db/schema";

/**
 * Razorpay integration for marketplace orders.
 *
 * Flow: checkout creates orders as PAYMENT_PENDING -> createRazorpayOrder ->
 * Checkout.js on the client -> /api/payments/razorpay/verify checks the payment
 * signature -> markRazorpayOrderPaid. The webhook at /api/webhooks/razorpay calls
 * the same function, so a closed tab after paying still confirms the order.
 *
 * Uses the REST API and Web Crypto directly (no SDK) so it runs on Workers.
 */

const API_BASE = "https://api.razorpay.com/v1";

export function getRazorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(getRazorpayKeyId() && process.env.RAZORPAY_KEY_SECRET);
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string compare, so signature checks don't leak timing. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Checkout.js success payload: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export async function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  secret = process.env.RAZORPAY_KEY_SECRET
): Promise<boolean> {
  if (!secret || !razorpayOrderId || !razorpayPaymentId || !signature) return false;
  const expected = await hmacSha256Hex(secret, `${razorpayOrderId}|${razorpayPaymentId}`);
  return safeEqual(expected, signature);
}

/** Webhook: HMAC_SHA256(raw request body, webhook secret) in X-Razorpay-Signature. */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret = process.env.RAZORPAY_WEBHOOK_SECRET
): Promise<boolean> {
  if (!secret || !signature) return false;
  const expected = await hmacSha256Hex(secret, rawBody);
  return safeEqual(expected, signature);
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

/** Create a Razorpay order. `amountPaise` is in the smallest unit (1 INR = 100 paise). */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const keyId = getRazorpayKeyId();
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) throw new Error("Razorpay is not configured");

  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${keyId}:${secret}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes ?? {},
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Razorpay order creation failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/**
 * Idempotently mark a Razorpay order as paid and release its merchant orders
 * to the stores (PAYMENT_PENDING -> PLACED). Returns the marketplace order ids.
 */
export async function markRazorpayOrderPaid(
  razorpayOrderId: string,
  razorpayPaymentId: string | null
): Promise<string[] | null> {
  const db = getDb();
  const payment = await db.query.marketplacePayments.findFirst({
    where: eq(marketplacePayments.razorpayOrderId, razorpayOrderId),
  });
  if (!payment) return null;

  if (payment.status !== "PAID") {
    await db
      .update(marketplacePayments)
      .set({ status: "PAID", razorpayPaymentId: razorpayPaymentId ?? payment.razorpayPaymentId, failureReason: null })
      .where(eq(marketplacePayments.id, payment.id));
  }

  const orderIds = payment.orderIds ?? [];
  if (orderIds.length > 0) {
    await db
      .update(marketplaceOrders)
      .set({ paymentStatus: "PAID" })
      .where(and(inArray(marketplaceOrders.id, orderIds), eq(marketplaceOrders.studentId, payment.studentId)));
    await db
      .update(marketplaceOrders)
      .set({ status: "PLACED" })
      .where(and(inArray(marketplaceOrders.id, orderIds), eq(marketplaceOrders.status, "PAYMENT_PENDING")));
  }
  return orderIds;
}

/** Record a failed attempt. A later successful attempt on the same order still wins. */
export async function markRazorpayOrderFailed(razorpayOrderId: string, reason: string): Promise<void> {
  const db = getDb();
  await db
    .update(marketplacePayments)
    .set({ status: "FAILED", failureReason: reason.slice(0, 500) })
    .where(and(eq(marketplacePayments.razorpayOrderId, razorpayOrderId), eq(marketplacePayments.status, "CREATED")));
}
