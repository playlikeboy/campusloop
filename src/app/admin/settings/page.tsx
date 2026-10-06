import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Admin System Settings & Rules",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await resolveAdminSession();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin Settings & Safety Policies"
        category="Telemetry & Security"
        icon={Settings}
        description="Configure automated content risk thresholds, Discord and Telegram moderation alert webhooks, and identity sealing policies."
      />

      <SettingsClient />
    </div>
  );
}
