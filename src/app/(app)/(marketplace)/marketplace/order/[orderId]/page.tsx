import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser } from "@/lib/server-cache";
import { OrderTrackingClient } from "./order-tracking-client";

interface OrderTrackingPageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata: Metadata = privateMetadata("Track order");

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { orderId } = await params;
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  return <OrderTrackingClient orderId={orderId} />;
}
