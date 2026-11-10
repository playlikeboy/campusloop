import { Server } from "lucide-react";
import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { SystemClient } from "./system-client";

export const metadata: Metadata = privateMetadata("System health");

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  await resolveAdminSession();

  const envMatrix = [
    {
      name: "DATABASE_URL",
      category: "Database",
      isConfigured: Boolean(process.env.DATABASE_URL),
      notes: "Main Postgres database (Neon)",
    },
    {
      name: "HEXCLAVE_PROJECT_ID",
      category: "Sign in",
      isConfigured: Boolean(process.env.HEXCLAVE_PROJECT_ID),
      notes: "Sign in and student sessions",
    },
    {
      name: "UPSTASH_REDIS_REST_URL",
      category: "Cache",
      isConfigured: Boolean(process.env.UPSTASH_REDIS_REST_URL),
      notes: "Cache and interest tracking for the feed",
    },
    {
      name: "QDRANT_URL",
      category: "Search",
      isConfigured: Boolean(process.env.QDRANT_URL),
      notes: "Similar-post search for the feed. The feed falls back to Postgres without it.",
    },
    {
      name: "COMPOSIO_API_KEY",
      category: "Integrations",
      isConfigured: Boolean(process.env.COMPOSIO_API_KEY),
      notes: "Reddit import, Cloudflare cache, Discord and Telegram alerts",
    },
    {
      name: "NEXT_PUBLIC_APP_URL",
      category: "Site",
      isConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      notes: "Public site address used in links",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System health"
        icon={Server}
        description="Check the database, Redis and environment settings."
      />

      <SystemClient envMatrix={envMatrix} />
    </div>
  );
}
