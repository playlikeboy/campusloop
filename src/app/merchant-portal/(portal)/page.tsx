import { privateMetadata } from "@/lib/seo";
import { MerchantDashboardClient } from "./merchant-dashboard-client";

export const metadata = privateMetadata("Store dashboard");

export default function MerchantDashboardPage() {
  return <MerchantDashboardClient />;
}
