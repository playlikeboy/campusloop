import { privateMetadata } from "@/lib/seo";
import { MerchantBikeBookingsClient } from "./merchant-bike-bookings-client";

export const metadata = privateMetadata("Bike bookings");

export default function MerchantBikeBookingsPage() {
  return <MerchantBikeBookingsClient />;
}
