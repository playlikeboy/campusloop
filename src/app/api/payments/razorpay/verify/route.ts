import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { marketplacePayments, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { markRazorpayOrderPaid, verifyPaymentSignature } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

/** Confirms a Checkout.js success callback by checking Razorpay's signature server-side. */
export async function POST(req: Request) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    } | null;
    const orderId = body?.razorpay_order_id ?? "";
    const paymentId = body?.razorpay_payment_id ?? "";
    const signature = body?.razorpay_signature ?? "";

    if (!(await verifyPaymentSignature(orderId, paymentId, signature))) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      columns: { id: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 403 });

    const payment = await db.query.marketplacePayments.findFirst({
      where: and(eq(marketplacePayments.razorpayOrderId, orderId), eq(marketplacePayments.studentId, profile.id)),
    });
    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const orderIds = await markRazorpayOrderPaid(orderId, paymentId);
    return NextResponse.json({ success: true, orderIds });
  } catch (error) {
    console.error("POST /api/payments/razorpay/verify error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
