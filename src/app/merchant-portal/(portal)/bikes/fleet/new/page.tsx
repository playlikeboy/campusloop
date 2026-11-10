import { privateMetadata } from "@/lib/seo";
import { MerchantNewBikeClient } from "./merchant-new-bike-client";

export const metadata = privateMetadata("Add a bike");

export default function MerchantNewBikePage() {
  return <MerchantNewBikeClient />;
}
