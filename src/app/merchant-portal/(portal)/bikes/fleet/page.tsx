import { privateMetadata } from "@/lib/seo";
import { MerchantFleetClient } from "./merchant-fleet-client";

export const metadata = privateMetadata("Your bikes");

export default function MerchantFleetPage() {
  return <MerchantFleetClient />;
}
