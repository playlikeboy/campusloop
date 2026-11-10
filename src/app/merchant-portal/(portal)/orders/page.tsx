import { privateMetadata } from "@/lib/seo";
import { MerchantOrdersClient } from "./merchant-orders-client";

export const metadata = privateMetadata("Orders");

export default function MerchantOrdersPage() {
  return <MerchantOrdersClient />;
}
