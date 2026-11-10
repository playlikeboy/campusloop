import { Zap } from "lucide-react";
import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { ComposioHubClient } from "./composio-hub-client";

export const metadata: Metadata = privateMetadata("Reddit import");

export const dynamic = "force-dynamic";

export default async function AdminComposioPage() {
  const { db } = await resolveAdminSession();

  const institutions = await db.query.institutions.findMany({
    columns: {
      id: true,
      name: true,
    },
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reddit import"
        icon={Zap}
        description="Import posts from Indian college subreddits, clear the CDN cache and export data."
      />

      <ComposioHubClient institutions={institutions} />
    </div>
  );
}
