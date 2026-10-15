import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { marketplaceOrders, marketplacePayments, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { createRazorpayOrder, getRazorpayKeyId, isRazorpayConfigured } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Create (or reuse) a Razorpay order covering the student's unpaid online orders.
 * Amount is always computed from server-side order totals, never from the client.
 */
export async function POST(req: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: "Online payments are not available right now." }, { status: 503 });
    }

    const user = await hexclaveServerApp.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { orderIds?: unknown } | null;
    const orderIds = Array.isArray(body?.orderIds)
      ? [...new Set(body.orderIds.filter((id): id is string => typeof id === "string" && SAFE_ID.test(id)))]
      : [];
    if (orderIds.length === 0 || orderIds.length > 5) {
      return NextResponse.json({ error: "Invalid orders" }, { status: 400 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      columns: { id: true, displayName: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 403 });

    const orders = await db
      .select({
        id: marketplaceOrders.id,
        orderNumber: marketplaceOrders.orderNumber,
        total: marketplaceOrders.total,
        status: marketplaceOrders.status,
        paymentStatus: marketplaceOrders.paymentStatus,
        paymentMethod: marketplaceOrders.paymentMethod,
      })
      .from(marketplaceOrders)
      .where(and(inArray(marketplaceOrders.id, orderIds), eq(marketplaceOrders.studentId, profile.id)));

    if (orders.length !== orderIds.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (orders.some((o) => o.paymentStatus === "PAID")) {
      return NextResponse.json({ error: "Already paid", code: "ALREADY_PAID" }, { status: 409 });
    }
    if (orders.some((o) => o.paymentMethod !== "RAZORPAY" || o.status !== "PAYMENT_PENDING")) {
      return NextResponse.json({ error: "These orders can't be paid online." }, { status: 409 });
    }

    const amountPaise = orders.reduce((sum, o) => sum + o.total, 0) * 100;
    if (amountPaise < 100) {
      return NextResponse.json({ error: "Order total is too low for online payment." }, { status: 400 });
    }

    // Reuse an open Razorpay order for the same set of orders, so retries don't pile up.
    const sortedKey = [...orderIds].sort().join(",");
    const openPayments = await db.query.marketplacePayments.findMany({
      where: and(
        eq(marketplacePayments.studentId, profile.id),
        inArray(marketplacePayments.status, ["CREATED", "FAILED"])
      ),
    });
    let payment = openPayments.find(
      (p) => [...(p.orderIds ?? [])].sort().join(",") === sortedKey && p.amount === amountPaise
    );

    if (!payment) {
      const rzpOrder = await createRazorpayOrder({
        amountPaise,
        receipt: orders.map((o) => o.orderNumber).join("+"),
        notes: { studentId: profile.id, orderIds: orderIds.join(",") },
      });
      [payment] = await db
        .insert(marketplacePayments)
        .values({
          razorpayOrderId: rzpOrder.id,
          studentId: profile.id,
          orderIds,
          amount: amountPaise,
          currency: "INR",
          status: "CREATED",
        })
        .returning();
    }

    return NextResponse.json({
      keyId: getRazorpayKeyId(),
      razorpayOrderId: payment.razorpayOrderId,
      amount: payment.amount,
      currency: payment.currency,
      description: orders.map((o) => o.orderNumber).join(", "),
      name: profile.displayName,
    });
  } catch (error) {
    console.error("POST /api/payments/razorpay/order error:", error);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
