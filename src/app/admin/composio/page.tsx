import { Zap } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { ComposioHubClient } from "./composio-hub-client";

export const metadata: Metadata = {
  title: "Reddit Ingestion Studio & Toolkits",
};

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
        title="Reddit Ingestion Studio & Integrations"
        category="Ingestion & Toolkits"
        icon={Zap}
        description="Fetch campus discussions from Indian university subreddits, control Cloudflare CDN cache, dispatch safety webhooks, and export records."
      />

      <ComposioHubClient institutions={institutions} />
    </div>
  );
}
