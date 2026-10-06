import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { AdminMarketplaceClient } from "./admin-marketplace-client";

export const metadata: Metadata = {
  title: "Marketplace Management",
  description: "Manage local business onboarding, product catalogs, and campus commerce.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminMarketplacePage() {
  await resolveAdminSession();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Campus Marketplace Management"
        category="Marketplace & Commerce"
        icon={ShoppingBag}
        description="Oversee verified student merchants, night canteens, dorm rentals, campus bicycle fleets, and order fulfillment."
      />

      <AdminMarketplaceClient />
    </div>
  );
}
