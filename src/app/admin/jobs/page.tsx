import { RotateCw } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { JobsClient } from "./jobs-client";

export const metadata: Metadata = {
  title: "Background Jobs & Pipelines",
};

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  await resolveAdminSession();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Background Jobs & Pipelines"
        category="Integrations & Automations"
        icon={RotateCw}
        description="Inspect asynchronous subreddit ingestion runs, Cloudflare CDN purges, Qdrant vector syncs, and telemetry export tasks."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Pipeline Active
          </span>
        }
      />

      <JobsClient />
    </div>
  );
}
