import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser } from "@/lib/server-cache";
import { FoodOrdersClient } from "./food-orders-client";

export const metadata: Metadata = privateMetadata("Food orders");

export default async function FoodOrdersPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  return <FoodOrdersClient />;
}
