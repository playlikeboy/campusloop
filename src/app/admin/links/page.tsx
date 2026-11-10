import { Link2 } from "lucide-react";
import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { AdminLinksClient } from "./links-table";

export const metadata: Metadata = privateMetadata("Short links");

export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
  await resolveAdminSession();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Short links"
        icon={Link2}
        description="Create campusloop.space/s/ links and see where clicks come from."
      />

      <AdminLinksClient />
    </div>
  );
}
