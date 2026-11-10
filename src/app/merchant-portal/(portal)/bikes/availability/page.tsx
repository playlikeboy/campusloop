import { privateMetadata } from "@/lib/seo";
import { MerchantAvailabilityClient } from "./merchant-availability-client";

export const metadata = privateMetadata("Bike availability");

export default function MerchantAvailabilityPage() {
  return <MerchantAvailabilityClient />;
}
