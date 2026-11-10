import { desc, sql } from "drizzle-orm";
import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { outreachContacts } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { OutreachClient } from "./outreach-client";

export const metadata: Metadata = privateMetadata("Outreach");

export const dynamic = "force-dynamic";

export default async function AdminOutreachPage() {
  const { db } = await resolveAdminSession();

  const [statsResult, initialContacts, collegeOptions] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${outreachContacts.status} = 'PENDING')::int`,
        sent: sql<number>`count(*) filter (where ${outreachContacts.status} in ('SENT', 'DELIVERED', 'OPENED', 'REPLIED'))::int`,
        delivered: sql<number>`count(*) filter (where ${outreachContacts.status} in ('DELIVERED', 'OPENED', 'REPLIED'))::int`,
        replied: sql<number>`count(*) filter (where ${outreachContacts.status} = 'REPLIED')::int`,
      })
      .from(outreachContacts)
      .then((rows) => rows[0] || { total: 0, pending: 0, sent: 0, delivered: 0, replied: 0 }),
    db.select().from(outreachContacts).orderBy(desc(outreachContacts.createdAt)).limit(50),
    db.query.institutions.findMany({
      columns: { id: true, name: true, slug: true, state: true, district: true },
      limit: 150,
    }),
  ]);

  const metrics = {
    total: statsResult.total ?? 0,
    pending: statsResult.pending ?? 0,
    sent: statsResult.sent ?? 0,
    delivered: statsResult.delivered ?? 0,
    replied: statsResult.replied ?? 0,
    replyRate:
      (statsResult.sent ?? 0) > 0
        ? Math.round(((statsResult.replied ?? 0) / (statsResult.sent ?? 1)) * 100)
        : 0,
  };

  const serializedContacts = initialContacts.map((c) => ({
    ...c,
    sentAt: c.sentAt ? new Date(c.sentAt).toISOString() : null,
    openedAt: c.openedAt ? new Date(c.openedAt).toISOString() : null,
    repliedAt: c.repliedAt ? new Date(c.repliedAt).toISOString() : null,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Outreach"
        icon={Mail}
        description="Send invites to college contacts and track who replied."
        badge={<Badge variant="neutral">{metrics.total} contacts</Badge>}
      />

      <OutreachClient
        initialContacts={serializedContacts}
        initialMetrics={metrics}
        colleges={collegeOptions}
      />
    </div>
  );
}
