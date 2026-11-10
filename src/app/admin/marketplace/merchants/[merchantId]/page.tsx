import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { AdminMerchantEditClient } from "./admin-merchant-edit-client";

interface AdminMerchantEditPageProps {
  params: Promise<{ merchantId: string }>;
}

export const metadata: Metadata = privateMetadata("Edit merchant");

export default async function AdminMerchantEditPage({ params }: AdminMerchantEditPageProps) {
  const { merchantId } = await params;
  return <AdminMerchantEditClient merchantId={merchantId} />;
}
