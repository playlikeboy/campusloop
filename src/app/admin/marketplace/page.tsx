import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { AdminMarketplaceClient } from "./admin-marketplace-client";

export const metadata: Metadata = privateMetadata("Marketplace");

export const dynamic = "force-dynamic";

export default async function AdminMarketplacePage() {
  await resolveAdminSession();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Marketplace"
        icon={ShoppingBag}
        description="Manage merchants, products, bike rentals and orders."
      />

      <AdminMarketplaceClient />
    </div>
  );
}
