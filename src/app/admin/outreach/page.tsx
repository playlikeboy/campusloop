import { desc, sql } from "drizzle-orm";
import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { institutions, outreachContacts } from "@/db/schema";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { OutreachClient } from "./outreach-client";

export const metadata: Metadata = {
  title: "Campus Outreach & Representative Network | Admin",
  description: "Manage outreach invitations and student ambassador recruitment across Indian universities.",
};

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
    db
      .select()
      .from(outreachContacts)
      .orderBy(desc(outreachContacts.createdAt))
      .limit(50),
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
        title="Campus Outreach & Ambassador Network"
        category="Content & Campus"
        icon={Mail}
        description="Dispatch polite invitations to verified college leads and student representatives across top Indian universities. Track delivery, reply rates, and campaign engagement."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            {metrics.total} Contacts Indexed
          </span>
        }
      />

      <OutreachClient
        initialContacts={serializedContacts}
        initialMetrics={metrics}
        colleges={collegeOptions}
      />
    </div>
  );
}
