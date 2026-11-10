"use client";

import { OrdersList } from "@/components/marketplace/orders-list";

export function FoodOrdersClient() {
  return (
    <OrdersList
      title="Food orders"
      backHref="/marketplace/food"
      category="food"
      include={(o) => !o.categorySlug || o.categorySlug === "food"}
      refreshInterval={6000}
      emptyTitle="No food orders yet"
      emptyHref="/marketplace/food"
      emptyAction="Order food"
    />
  );
}
