"use client";

/**
 * Client helper for Razorpay Checkout.js.
 * Creates the Razorpay order server-side, opens the payment sheet, and verifies
 * the result server-side. The webhook confirms the payment too, so a closed tab
 * after paying still ends up PAID.
 */

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type PayResult = { status: "paid"; orderIds: string[] } | { status: "dismissed" } | { status: "failed"; message: string };

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (resp: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load Razorpay. Check your connection."));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

export async function payWithRazorpay(
  orderIds: string[],
  prefill?: { name?: string; contact?: string; email?: string }
): Promise<PayResult> {
  const res = await fetch("/api/payments/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderIds }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    keyId?: string;
    razorpayOrderId?: string;
    amount?: number;
    currency?: string;
    description?: string;
    name?: string;
  };
  if (data.code === "ALREADY_PAID") return { status: "paid", orderIds };
  if (!res.ok || !data.keyId || !data.razorpayOrderId) {
    return { status: "failed", message: data.error || "Could not start payment." };
  }

  await loadCheckoutScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) return { status: "failed", message: "Razorpay failed to load." };

  return new Promise<PayResult>((resolve) => {
    let settled = false;
    const finish = (result: PayResult) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    const rzp = new Razorpay({
      key: data.keyId,
      order_id: data.razorpayOrderId,
      amount: data.amount,
      currency: data.currency ?? "INR",
      name: "CampusLoop",
      description: `Order ${data.description ?? ""}`.trim(),
      prefill: { name: prefill?.name ?? data.name, contact: prefill?.contact, email: prefill?.email },
      theme: { color: "#22c55e" },
      handler: async (resp: RazorpaySuccess) => {
        try {
          const verify = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          const v = (await verify.json().catch(() => ({}))) as { orderIds?: string[]; error?: string };
          if (verify.ok) finish({ status: "paid", orderIds: v.orderIds ?? orderIds });
          else finish({ status: "failed", message: v.error || "Payment could not be verified." });
        } catch {
          // The webhook will still confirm a real payment.
          finish({ status: "failed", message: "Payment received, confirming. Check the order page shortly." });
        }
      },
      modal: { ondismiss: () => finish({ status: "dismissed" }) },
    });
    rzp.on("payment.failed", (resp) => {
      // Razorpay keeps the sheet open for a retry; only report if the user then closes it.
      console.warn("Razorpay payment failed:", resp.error?.description);
    });
    rzp.open();
  });
}
