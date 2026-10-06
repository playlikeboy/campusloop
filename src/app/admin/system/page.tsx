import { Server } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { SystemClient } from "./system-client";

export const metadata: Metadata = {
  title: "System Diagnostics & Telemetry",
};

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  await resolveAdminSession();

  const envMatrix = [
    {
      name: "DATABASE_URL",
      category: "Database",
      isConfigured: Boolean(process.env.DATABASE_URL),
      notes: "Neon Serverless PostgreSQL connection pool",
    },
    {
      name: "HEXCLAVE_PROJECT_ID",
      category: "Authentication",
      isConfigured: Boolean(process.env.HEXCLAVE_PROJECT_ID),
      notes: "Student verification and session management engine",
    },
    {
      name: "UPSTASH_REDIS_REST_URL",
      category: "Caching & Signaling",
      isConfigured: Boolean(process.env.UPSTASH_REDIS_REST_URL),
      notes: "Sub-5ms user behavior tracking and interest affinity sets",
    },
    {
      name: "QDRANT_URL",
      category: "Vector Database",
      isConfigured: Boolean(process.env.QDRANT_URL),
      notes: "Semantic feed recommendations (circuit-breaker protected with relational fallback)",
    },
    {
      name: "COMPOSIO_API_KEY",
      category: "Integrations",
      isConfigured: Boolean(process.env.COMPOSIO_API_KEY),
      notes: "Multi-app orchestration (Reddit, Cloudflare, Discord, Telegram, Sheets)",
    },
    {
      name: "NEXT_PUBLIC_APP_URL",
      category: "Network",
      isConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      notes: "Canonical domain binding (campusloop.space)",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System Diagnostics & Health Matrix"
        category="Telemetry & Security"
        icon={Server}
        description="Verify database connections, live service latency, Upstash Redis signaling, and edge environment configuration."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Systems Operational
          </span>
        }
      />

      <SystemClient envMatrix={envMatrix} />
    </div>
  );
}
