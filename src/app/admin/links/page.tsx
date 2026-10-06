import { Link2 } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { AdminLinksClient } from "./links-table";

export const metadata: Metadata = {
  title: "Short Links & Referrals",
  description: "Track campaigns, short links, and referral traffic in real time.",
};

export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
  await resolveAdminSession();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Short Links & Referral Traffic"
        category="Integrations & Studio"
        icon={Link2}
        description="Create brand short links (`campusloop.space/s/[slug]`), track student ambassador campaigns, device breakdown, and conversion clicks."
      />

      <AdminLinksClient />
    </div>
  );
}
