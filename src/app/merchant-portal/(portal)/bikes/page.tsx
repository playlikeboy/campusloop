import { privateMetadata } from "@/lib/seo";
import { MerchantBikeDashboardClient } from "./merchant-bike-dashboard-client";

export const metadata = privateMetadata("Bike rentals");

export default function MerchantBikeDashboardPage() {
  return <MerchantBikeDashboardClient />;
}
