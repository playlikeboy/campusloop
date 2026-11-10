import { privateMetadata } from "@/lib/seo";
import { MerchantBikeSettingsClient } from "./merchant-bike-settings-client";

export const metadata = privateMetadata("Rental rules");

export default function MerchantBikeSettingsPage() {
  return <MerchantBikeSettingsClient />;
}
