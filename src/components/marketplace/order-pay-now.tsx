"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { payWithRazorpay } from "@/lib/payments/razorpay-checkout";

/** Shown on an online order that hasn't been paid yet. The store only sees it after payment. */
export function OrderPayNow({
  orderId,
  total,
  phone,
  onPaid,
}: {
  orderId: string;
  total: number;
  phone?: string;
  onPaid: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handlePay() {
    setBusy(true);
    try {
      const result = await payWithRazorpay([orderId], { contact: phone });
      if (result.status === "paid") {
        toast.success("Payment successful. The store has your order.");
        onPaid();
      } else if (result.status === "failed") {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment could not start.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl bg-amber-500/10 p-4 space-y-3">
      <div>
        <p className="text-sm font-black text-foreground">Payment pending</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          The store receives this order once payment goes through.
        </p>
      </div>
      <button
        type="button"
        onClick={handlePay}
        disabled={busy}
        className="w-full h-11 rounded-2xl bg-foreground text-background text-sm font-black flex items-center justify-center gap-2 transition-opacity cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
        <span>{busy ? "Opening payment..." : `Pay ₹${total.toLocaleString("en-IN")} now`}</span>
      </button>
    </div>
  );
}
