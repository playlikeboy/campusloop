import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { Send } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { emailCampaigns, emailTemplates, institutions, userProfiles } from "@/db/schema";
import { isMissingEmailTable } from "@/lib/email-campaigns/queue";
import { privateMetadata } from "@/lib/seo";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";
import { type CampaignListItem, EmailsClient, type SavedTemplate } from "./emails-client";

export const metadata: Metadata = privateMetadata("Emails");

export const dynamic = "force-dynamic";

type Loaded<T> = { value: T; missing: boolean };
const loaded = <T,>(value: T): Loaded<T> => ({ value, missing: false });
/** A missing email table (migration not applied) degrades to empty data plus a banner. */
const failed =
  <T,>(fallback: T) =>
  (error: unknown): Loaded<T> => {
    const missing = isMissingEmailTable(error);
    if (!missing) console.error("[admin/emails] load failed:", error);
    return { value: fallback, missing };
  };

export default async function AdminEmailsPage() {
  const { db, profile } = await resolveAdminSession();

  const [templatesRes, campaignsRes, collegesRes, branchesRes] = await Promise.all([
    db
      .select()
      .from(emailTemplates)
      .orderBy(desc(emailTemplates.updatedAt))
      .limit(100)
      .then(loaded, failed([] as (typeof emailTemplates.$inferSelect)[])),
    db
      .select({
        id: emailCampaigns.id,
        name: emailCampaigns.name,
        subject: emailCampaigns.subject,
        status: emailCampaigns.status,
        totalCount: emailCampaigns.totalCount,
        sentCount: emailCampaigns.sentCount,
        failedCount: emailCampaigns.failedCount,
        skippedCount: emailCampaigns.skippedCount,
        createdAt: emailCampaigns.createdAt,
      })
      .from(emailCampaigns)
      .orderBy(desc(emailCampaigns.createdAt))
      .limit(30)
      .then(loaded, failed([])),
    db
      .select({
        id: institutions.id,
        name: institutions.name,
        students: sql<number>`count(${userProfiles.id})::int`,
      })
      .from(userProfiles)
      .innerJoin(institutions, eq(userProfiles.institutionId, institutions.id))
      .where(eq(userProfiles.isSeeded, false))
      .groupBy(institutions.id, institutions.name)
      .orderBy(sql`count(${userProfiles.id}) desc`)
      .limit(500)
      .then(loaded, failed([] as { id: string; name: string; students: number }[])),
    db
      .select({
        branch: sql<string>`lower(trim(${userProfiles.branch}))`,
        students: sql<number>`count(*)::int`,
      })
      .from(userProfiles)
      .where(isNotNull(userProfiles.branch))
      .groupBy(sql`lower(trim(${userProfiles.branch}))`)
      .orderBy(sql`count(*) desc`)
      .limit(60)
      .then(loaded, failed([] as { branch: string; students: number }[])),
  ]);
  const templates = templatesRes.value;
  const campaigns = campaignsRes.value;
  const colleges = collegesRes.value;
  const branches = branchesRes.value;
  const migrationMissing = [templatesRes, campaignsRes, collegesRes, branchesRes].some((r) => r.missing);

  const savedTemplates: SavedTemplate[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    presetKey: t.presetKey,
    subject: t.subject,
    preheader: t.preheader,
    heading: t.heading,
    body: t.body,
    buttonLabel: t.buttonLabel,
    buttonUrl: t.buttonUrl,
    updatedAt: t.updatedAt.toISOString(),
  }));

  const campaignItems: CampaignListItem[] = campaigns.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  const running = campaignItems.filter((c) => c.status === "QUEUED" || c.status === "SENDING").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Emails"
        icon={Send}
        description="Write an email from a template, pick who gets it, preview it and send it in safe batches."
        badge={running > 0 ? <Badge variant="warning">{running} sending</Badge> : undefined}
      />

      <EmailsClient
        templates={savedTemplates}
        campaigns={campaignItems}
        colleges={colleges.map((c) => ({ id: c.id, name: c.name, students: Number(c.students) }))}
        branches={branches.filter((b) => b.branch).map((b) => ({ value: b.branch, students: Number(b.students) }))}
        adminEmail={profile?.email ?? ""}
        migrationMissing={migrationMissing}
      />
    </div>
  );
}
