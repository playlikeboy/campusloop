"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { playNewOrderChime } from "./order-chime";
import type { MerchantOrder } from "./order-types";

/**
 * Chimes and toasts once for each new PLACED order that shows up after the first load.
 * The first load only seeds the list, so opening the page never rings.
 */
export function useNewOrderAlert(orders: MerchantOrder[] | undefined, soundOn: boolean) {
  const known = useRef<Set<string> | null>(null);
  // Switching tabs can load older orders; only orders placed after this screen opened should ring.
  const openedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!orders) return;
    if (!known.current) {
      openedAt.current = Date.now() - 60_000;
      known.current = new Set(orders.map((o) => o.id));
      return;
    }
    const fresh = orders.filter(
      (o) =>
        o.status === "PLACED" &&
        !known.current?.has(o.id) &&
        new Date(o.createdAt).getTime() >= (openedAt.current ?? 0)
    );
    for (const o of orders) known.current.add(o.id);
    if (fresh.length === 0) return;

    if (soundOn) playNewOrderChime();
    haptics.heavy();
    for (const o of fresh) {
      const place = o.deliveryAddress?.hostelName || (o.fulfillmentType === "PICKUP" ? "Pickup" : "Campus");
      toast.success(`New order #${o.orderNumber} · ₹${o.total}`, {
        description: `${o.student?.displayName || "A student"} · ${place}`,
        duration: 10000,
      });
    }
  }, [orders, soundOn]);
}
