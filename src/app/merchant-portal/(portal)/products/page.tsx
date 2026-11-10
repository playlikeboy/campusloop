import { privateMetadata } from "@/lib/seo";
import { MerchantProductsClient } from "./merchant-products-client";

export const metadata = privateMetadata("Menu");

export default function MerchantProductsPage() {
  return <MerchantProductsClient />;
}
