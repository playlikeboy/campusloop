import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { AdminMerchantsClient } from "./admin-merchants-client";

export const metadata: Metadata = privateMetadata("Merchants");

export default function AdminMerchantsPage() {
  return <AdminMerchantsClient />;
}
