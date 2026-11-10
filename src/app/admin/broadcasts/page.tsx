import { desc, eq, isNotNull } from "drizzle-orm";
import { Megaphone } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { institutions, posts } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { BroadcastsClient } from "./broadcasts-client";

export const metadata: Metadata = privateMetadata("Broadcasts");

export const dynamic = "force-dynamic";

export default async function AdminBroadcastsPage() {
  const { db } = await resolveAdminSession();

  const [institutionsList, rawBroadcasts] = await Promise.all([
    db.query.institutions.findMany({
      columns: { id: true, name: true, state: true, district: true, nirfRank: true },
      limit: 60,
    }),
    db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        scope: posts.scope,
        status: posts.status,
        createdAt: posts.createdAt,
        institutionName: institutions.name,
      })
      .from(posts)
      .leftJoin(institutions, eq(posts.institutionId, institutions.id))
      .where(isNotNull(posts.title))
      .orderBy(desc(posts.createdAt))
      .limit(30)
      .catch(() => []),
  ]);

  const recentBroadcasts = rawBroadcasts.map((b) => ({
    ...b,
    status: b.status || "PUBLISHED",
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Broadcasts"
        icon={Megaphone}
        description="Send notices and alerts to students."
        badge={<Badge variant="neutral">{recentBroadcasts.length} broadcasts</Badge>}
      />

      <BroadcastsClient institutions={institutionsList} recentBroadcasts={recentBroadcasts} />
    </div>
  );
}
