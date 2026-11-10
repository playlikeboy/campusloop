import { privateMetadata } from "@/lib/seo";
import { MerchantReviewsClient } from "./merchant-reviews-client";

export const metadata = privateMetadata("Reviews");

export default function MerchantReviewsPage() {
  return <MerchantReviewsClient />;
}
