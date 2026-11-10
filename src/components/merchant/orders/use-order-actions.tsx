"use client";

import { useState } from "react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { readError } from "../merchant-utils";
import { RejectDialog } from "../reject-dialog";
import { statusLabel } from "../status-badge";
import type { MerchantOrder, OrderStep } from "./order-types";

/** Status changes + reject-with-reason dialog for order lists. */
export function useOrderActions(refresh: () => unknown) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<MerchantOrder | null>(null);

  async function update(orderId: string, status: string, rejectionReason?: string): Promise<boolean> {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/merchant/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (!res.ok)
        throw new Error(
          await readError(res, "Couldn't update the order. Check your internet and try again.")
        );
      sounds.ting();
      haptics.success();
      await refresh();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the order. Try again.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function advance(order: MerchantOrder, step: OrderStep) {
    if (await update(order.id, step.status)) {
      toast.success(`Order #${order.orderNumber}: ${statusLabel("order", step.status).toLowerCase()}`);
    }
  }

  const rejectDialog = (
    <RejectDialog
      open={Boolean(rejecting)}
      onOpenChange={(open) => !open && setRejecting(null)}
      title={rejecting ? `Reject order #${rejecting.orderNumber}?` : "Reject order?"}
      loading={Boolean(rejecting && busyId === rejecting.id)}
      onConfirm={async (reason) => {
        if (!rejecting) return;
        if (await update(rejecting.id, "REJECTED", reason)) {
          toast.success(`Order #${rejecting.orderNumber} rejected`);
          setRejecting(null);
        }
      }}
    />
  );

  return { busyId, advance, reject: setRejecting, rejectDialog };
}
