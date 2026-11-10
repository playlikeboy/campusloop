import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser } from "@/lib/server-cache";
import { SupermarketOrdersClient } from "./supermarket-orders-client";

export const metadata: Metadata = privateMetadata("Mart orders");

export default async function SupermarketOrdersPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  return <SupermarketOrdersClient />;
}
