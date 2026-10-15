import { NextResponse } from "next/server";
import { markRazorpayOrderFailed, markRazorpayOrderPaid, verifyWebhookSignature } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

interface RazorpayWebhookEvent {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; error_description?: string } };
    order?: { entity?: { id?: string } };
  };
}

/**
 * Razorpay webhook: https://campusloop.space/api/webhooks/razorpay
 * Subscribed events: payment.captured, order.paid, payment.failed.
 * Signature is HMAC-SHA256 of the raw body with RAZORPAY_WEBHOOK_SECRET.
 * Handlers are idempotent; Razorpay retries on non-2xx.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id || event.payload?.order?.entity?.id;

  try {
    if (razorpayOrderId) {
      if (event.event === "payment.captured" || event.event === "order.paid") {
        await markRazorpayOrderPaid(razorpayOrderId, payment?.id ?? null);
      } else if (event.event === "payment.failed") {
        await markRazorpayOrderFailed(razorpayOrderId, payment?.error_description || "Payment failed");
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
