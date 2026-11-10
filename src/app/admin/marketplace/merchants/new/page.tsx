import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { AdminNewMerchantClient } from "./admin-new-merchant-client";

export const metadata: Metadata = privateMetadata("Add a merchant");

export default function AdminNewMerchantPage() {
  return <AdminNewMerchantClient />;
}
