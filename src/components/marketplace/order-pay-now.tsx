"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { payWithRazorpay } from "@/lib/payments/razorpay-checkout";

/** Shown on an online order that hasn't been paid yet. The store only sees it after payment. */
export function OrderPayNow({
  orderId,
  total,
  phone,
  onPaid,
}: {
  orderId: string;
  total: number | string;
  phone?: string;
  onPaid: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handlePay() {
    setBusy(true);
    try {
      const result = await payWithRazorpay([orderId], { contact: phone });
      if (result.status === "paid") {
        toast.success("Paid. The store has your order.");
        onPaid();
      } else if (result.status === "failed") {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't open payment. Check your internet and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Payment" className="space-y-3 rounded-lg border border-border bg-warning-subtle p-4">
      <div>
        <p className="text-sm font-semibold text-fg">Payment pending</p>
        <p className="mt-0.5 text-sm text-fg-muted">The store gets your order once you pay.</p>
      </div>
      <Button type="button" onClick={handlePay} loading={busy} className="w-full">
        {!busy && <CreditCard className="size-4" />}
        {busy ? "Opening payment..." : `Pay ₹${Number(total || 0).toLocaleString("en-IN")} now`}
      </Button>
    </section>
  );
}
