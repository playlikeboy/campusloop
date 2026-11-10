import { privateMetadata } from "@/lib/seo";
import { MerchantStoreClient } from "./merchant-store-client";

export const metadata = privateMetadata("Store details");

export default function MerchantStorePage() {
  return <MerchantStoreClient />;
}
