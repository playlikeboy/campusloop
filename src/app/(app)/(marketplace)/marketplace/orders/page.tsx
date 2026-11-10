import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser } from "@/lib/server-cache";
import { OrdersClient } from "./orders-client";

export const metadata: Metadata = privateMetadata("Your orders");

export default async function OrdersPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  return <OrdersClient />;
}
