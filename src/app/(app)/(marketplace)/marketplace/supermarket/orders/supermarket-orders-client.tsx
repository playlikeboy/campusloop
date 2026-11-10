"use client";

import { OrdersList } from "@/components/marketplace/orders-list";

export function SupermarketOrdersClient() {
  return (
    <OrdersList
      title="Mart orders"
      backHref="/marketplace/supermarket"
      category="essentials"
      include={(o) => o.categorySlug === "essentials" || o.categorySlug === "mart"}
      refreshInterval={6000}
      emptyTitle="No mart orders yet"
      emptyHref="/marketplace/supermarket"
      emptyAction="Shop the mart"
    />
  );
}
