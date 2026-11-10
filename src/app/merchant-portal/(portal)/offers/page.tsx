import { privateMetadata } from "@/lib/seo";
import { MerchantOffersClient } from "./merchant-offers-client";

export const metadata = privateMetadata("Offers");

export default function MerchantOffersPage() {
  return <MerchantOffersClient />;
}
