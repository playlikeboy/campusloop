import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser } from "@/lib/server-cache";
import { BikeBookingClient } from "./bike-booking-client";

interface BikeBookingPageProps {
  params: Promise<{ bookingId: string }>;
}

export const metadata: Metadata = privateMetadata("Your booking");

export default async function BikeBookingPage({ params }: BikeBookingPageProps) {
  const { bookingId } = await params;
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  return <BikeBookingClient bookingId={bookingId} />;
}
