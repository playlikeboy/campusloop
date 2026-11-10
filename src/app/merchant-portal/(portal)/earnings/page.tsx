import { privateMetadata } from "@/lib/seo";
import { MerchantEarningsClient } from "./merchant-earnings-client";

export const metadata = privateMetadata("Earnings");

export default function MerchantEarningsPage() {
  return <MerchantEarningsClient />;
}
