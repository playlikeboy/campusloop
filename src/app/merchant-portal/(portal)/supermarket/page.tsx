import { privateMetadata } from "@/lib/seo";
import { SupermarketDashboardClient } from "./supermarket-dashboard-client";

export const metadata = privateMetadata("Mart dashboard");

export default function SupermarketDashboardPage() {
  return <SupermarketDashboardClient />;
}
