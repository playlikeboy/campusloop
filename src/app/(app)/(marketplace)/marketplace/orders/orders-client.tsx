"use client";

import { OrdersList } from "@/components/marketplace/orders-list";

export function OrdersClient() {
  return (
    <OrdersList
      title="Your orders"
      backHref="/marketplace"
      emptyTitle="No orders yet"
      emptyHref="/marketplace"
      emptyAction="Browse stores"
    />
  );
}
