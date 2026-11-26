"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  emailCampaignRecipients,
  emailCampaigns,
  emailTemplates,
  moderationActions,
} from "@/db/schema";
import { sendEmail } from "@/lib/email";
import {
  buildCampaignMessage,
  cancelCampaign,
  createDbQueueStore,
  enqueueRecipients,
  isMissingEmailTable,
  processCampaignQueue,
} from "@/lib/email-campaigns/queue";
import { allowEmailAction } from "@/lib/email-campaigns/rate-limit";
import type { CampaignContent, CampaignVariables } from "@/lib/email-campaigns/render";
import { safeUrl } from "@/lib/email-campaigns/render";
import {
  describeSegment,
  isDeliverableEmail,
  MAX_CAMPAIGN_RECIPIENTS,
  normalizeSegment,
  resolveSegment,
  variablesForRow,
} from "@/lib/email-campaigns/segments";
import { requireAdminProfile } from "../_lib/guard";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const MIGRATION_HINT = "Email tables are missing. Apply drizzle/manual/0017_email_campaigns.sql first.";

function fail(error: unknown, fallback: string): { ok: false; error: string } {
  if (isMissingEmailTable(error)) return { ok: false, error: MIGRATION_HINT };
  console.error(`[admin/emails] ${fallback}:`, error);
  return { ok: false, error: fallback };
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

/** Validates untrusted editor input. */
function normalizeContent(input: unknown): CampaignContent {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return {
    subject: text(raw.subject, 200).trim(),
    preheader: text(raw.preheader, 200).trim(),
    heading: text(raw.heading, 200).trim(),
    body: text(raw.body, 20_000),
    buttonLabel: text(raw.buttonLabel, 60).trim() || null,
    buttonUrl: text(raw.buttonUrl, 2000).trim() || null,
  };
}

function contentError(content: CampaignContent): string | null {
  if (!content.subject) return "Add a subject line.";
  if (!content.body.trim() && !content.heading) return "Add a heading or some body text.";
  if (content.buttonLabel && !content.buttonUrl) return "Add a link for the button, or clear the button label.";
  if (content.buttonUrl && !safeUrl(content.buttonUrl)) return "The button link must start with https:// or /.";
  return null;
}

async function logAction(
  db: Awaited<ReturnType<typeof requireAdminProfile>>["db"],
  moderatorId: string,
  action: string,
  targetId: string,
  reason: string
) {
  try {
    await db.insert(moderationActions).values({ moderatorId, targetType: "USER", targetId, action, reason: reason.slice(0, 500) });
  } catch (error) {
    console.warn("[admin/emails] audit log failed:", error);
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function saveEmailTemplate(input: {
  id?: string | null;
  name: string;
  presetKey?: string | null;
  content: CampaignContent;
}): Promise<Result<{ id: string }>> {
  const { db, profile } = await requireAdminProfile();
  if (!(await allowEmailAction(`tpl:${profile.id}`, 30, 60))) return { ok: false, error: "Too many saves. Wait a minute." };

  const name = text(input?.name, 120).trim();
  if (!name) return { ok: false, error: "Give the template a name." };
  const content = normalizeContent(input?.content);
  const invalid = contentError(content);
  if (invalid) return { ok: false, error: invalid };
  const values = { name, presetKey: text(input?.presetKey, 60) || null, ...content };

  try {
    const id = typeof input?.id === "string" && input.id ? input.id : null;
    if (id) {
      const [row] = await db
        .update(emailTemplates)
        .set(values)
        .where(eq(emailTemplates.id, id))
        .returning({ id: emailTemplates.id });
      if (!row) return { ok: false, error: "That template no longer exists." };
      revalidatePath("/admin/emails");
      return { ok: true, id: row.id };
    }
    const [row] = await db
      .insert(emailTemplates)
      .values({ ...values, createdById: profile.id })
      .returning({ id: emailTemplates.id });
    revalidatePath("/admin/emails");
    return { ok: true, id: row.id };
  } catch (error) {
    return fail(error, "Could not save the template");
  }
}

export async function deleteEmailTemplate(id: string): Promise<Result> {
  const { db, profile } = await requireAdminProfile();
  if (!(await allowEmailAction(`tpl:${profile.id}`, 30, 60))) return { ok: false, error: "Too many changes. Wait a minute." };
  try {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, text(id, 64)));
    revalidatePath("/admin/emails");
    return { ok: true };
  } catch (error) {
    return fail(error, "Could not delete the template");
  }
}

// ─── Audience ────────────────────────────────────────────────────────────────

export async function countEmailSegment(
  segmentInput: unknown
): Promise<Result<{ count: number; capped: boolean; sample: CampaignVariables | null; summary: string }>> {
  const { db, profile } = await requireAdminProfile();
  if (!(await allowEmailAction(`count:${profile.id}`, 90, 60))) return { ok: false, error: "Slow down a little." };
  const spec = normalizeSegment(segmentInput);
  try {
    const [rows, names] = await Promise.all([
      resolveSegment(db, spec),
      spec.institutionIds.length > 0
        ? db.query.institutions.findMany({
            columns: { id: true, name: true },
            where: (t, { inArray }) => inArray(t.id, spec.institutionIds),
          })
        : Promise.resolve([] as { id: string; name: string }[]),
    ]);
    const sampleRow = rows[0];
    return {
      ok: true,
      count: Math.min(rows.length, MAX_CAMPAIGN_RECIPIENTS),
      capped: rows.length > MAX_CAMPAIGN_RECIPIENTS,
      sample: sampleRow ? variablesForRow(sampleRow) : null,
      summary: describeSegment(spec, Object.fromEntries(names.map((n) => [n.id, n.name]))),
    };
  } catch (error) {
    return fail(error, "Could not count this audience");
  }
}

// ─── Sending ─────────────────────────────────────────────────────────────────

export async function sendTestEmail(input: {
  to: string;
  content: CampaignContent;
  vars?: Partial<CampaignVariables> | null;
}): Promise<Result> {
  const { profile } = await requireAdminProfile();
  if (!(await allowEmailAction(`test:${profile.id}`, 10, 600))) {
    return { ok: false, error: "Test limit reached (10 per 10 minutes)." };
  }
  const to = text(input?.to, 254).trim().toLowerCase();
  if (!isDeliverableEmail(to)) return { ok: false, error: "Enter a real email address." };
  const content = normalizeContent(input?.content);
  const invalid = contentError(content);
  if (invalid) return { ok: false, error: invalid };

  const raw = (input?.vars ?? {}) as Record<string, unknown>;
  const vars: Partial<CampaignVariables> = {
    first_name: text(raw.first_name, 80),
    college: text(raw.college, 200),
    username: text(raw.username, 80),
  };

  // The unsubscribe link in a test points at a dummy token, so clicking it changes nothing.
  const message = buildCampaignMessage(content, { profileId: profile.id, email: to }, vars, () => "test-preview");
  const result = await sendEmail({ ...message, subject: `[Test] ${message.subject}` });
  if (!result.success) return { ok: false, error: result.error || "The email provider refused the test." };
  if (result.simulated && process.env.NODE_ENV === "production") {
    return { ok: false, error: "Email provider is not configured; the test was only simulated." };
  }
  return { ok: true };
}

export async function createEmailCampaign(input: {
  name: string;
  templateId?: string | null;
  content: CampaignContent;
  segment: unknown;
  expectedCount: number;
}): Promise<Result<{ id: string; total: number }>> {
  const { db, profile } = await requireAdminProfile();
  if (!(await allowEmailAction(`campaign:${profile.id}`, 5, 3600))) {
    return { ok: false, error: "Campaign limit reached (5 per hour)." };
  }

  const content = normalizeContent(input?.content);
  const invalid = contentError(content);
  if (invalid) return { ok: false, error: invalid };
  const spec = normalizeSegment(input?.segment);
  const name = text(input?.name, 120).trim() || content.subject.slice(0, 120);

  try {
    const rows = await resolveSegment(db, spec);
    if (rows.length === 0) return { ok: false, error: "Nobody matches this audience." };
    if (rows.length > MAX_CAMPAIGN_RECIPIENTS) {
      return { ok: false, error: `Audience is over ${MAX_CAMPAIGN_RECIPIENTS.toLocaleString("en-IN")}. Narrow it down.` };
    }
    // The confirmation showed a number; refuse if the audience moved since then.
    if (Number(input?.expectedCount) !== rows.length) {
      return { ok: false, error: `The audience changed to ${rows.length.toLocaleString("en-IN")} people. Check and confirm again.` };
    }

    let templateId: string | null = null;
    if (typeof input?.templateId === "string" && input.templateId) {
      const tpl = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, input.templateId),
        columns: { id: true },
      });
      templateId = tpl?.id ?? null;
    }

    const [campaign] = await db
      .insert(emailCampaigns)
      .values({
        name,
        templateId,
        ...content,
        segment: spec as unknown as Record<string, unknown>,
        status: "QUEUED",
        createdById: profile.id,
      })
      .returning({ id: emailCampaigns.id });

    const store = createDbQueueStore(db);
    const total = await enqueueRecipients(
      store,
      campaign.id,
      rows.filter((r) => r.email).map((r) => ({ profileId: r.id, email: r.email as string }))
    );
    await db.update(emailCampaigns).set({ totalCount: total }).where(eq(emailCampaigns.id, campaign.id));

    const collegeNames =
      spec.institutionIds.length > 0
        ? Object.fromEntries(
            (
              await db.query.institutions.findMany({
                columns: { id: true, name: true },
                where: (t, { inArray }) => inArray(t.id, spec.institutionIds),
              })
            ).map((i) => [i.id, i.name])
          )
        : {};
    await logAction(
      db,
      profile.id,
      "EMAIL_CAMPAIGN_SEND",
      campaign.id,
      `"${name}" to ${total} people. ${describeSegment(spec, collegeNames)}`
    );

    revalidatePath("/admin/emails");
    return { ok: true, id: campaign.id, total };
  } catch (error) {
    return fail(error, "Could not create the campaign");
  }
}

export async function cancelEmailCampaign(id: string): Promise<Result> {
  const { db, profile } = await requireAdminProfile();
  if (!(await allowEmailAction(`cancel:${profile.id}`, 20, 60))) return { ok: false, error: "Slow down a little." };
  const campaignId = text(id, 64);
  try {
    const existing = await db.query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, campaignId),
      columns: { id: true, name: true, status: true },
    });
    if (!existing) return { ok: false, error: "Campaign not found." };
    if (existing.status !== "QUEUED" && existing.status !== "SENDING") {
      return { ok: false, error: "This campaign is not running." };
    }
    await cancelCampaign(db, campaignId);
    await logAction(db, profile.id, "EMAIL_CAMPAIGN_CANCEL", campaignId, `Cancelled "${existing.name}"`);
    revalidatePath("/admin/emails");
    revalidatePath(`/admin/emails/${campaignId}`);
    return { ok: true };
  } catch (error) {
    return fail(error, "Could not cancel the campaign");
  }
}

/** Sends one batch right now instead of waiting for the next cron run. */
export async function processEmailQueueNow(): Promise<Result<{ sent: number; failed: number; skipped: number }>> {
  const { db, profile } = await requireAdminProfile();
  if (!(await allowEmailAction(`process:${profile.id}`, 6, 60))) return { ok: false, error: "Wait a few seconds between batches." };
  if (process.env.EMAIL_CAMPAIGNS_ENABLED === "false") {
    return { ok: false, error: "Campaign sending is paused (EMAIL_CAMPAIGNS_ENABLED=false)." };
  }
  try {
    const result = await processCampaignQueue({
      store: createDbQueueStore(db),
      send: sendEmail,
      maxBatches: 1,
      timeBudgetMs: 20_000,
      treatSimulatedAsFailure: process.env.NODE_ENV === "production",
    });
    revalidatePath("/admin/emails");
    return { ok: true, sent: result.sent, failed: result.failed, skipped: result.skipped };
  } catch (error) {
    return fail(error, "Could not send a batch");
  }
}

export interface CampaignProgress {
  id: string;
  status: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  queued: number;
  finishedAt: string | null;
}

export async function getEmailCampaignProgress(id: string): Promise<Result<{ progress: CampaignProgress }>> {
  const { db, profile } = await requireAdminProfile();
  if (!(await allowEmailAction(`progress:${profile.id}`, 120, 60))) return { ok: false, error: "Slow down a little." };
  const campaignId = text(id, 64);
  try {
    const [campaign, [queued]] = await Promise.all([
      db.query.emailCampaigns.findFirst({ where: eq(emailCampaigns.id, campaignId) }),
      db
        .select({ n: count() })
        .from(emailCampaignRecipients)
        .where(and(eq(emailCampaignRecipients.campaignId, campaignId), eq(emailCampaignRecipients.status, "QUEUED"))),
    ]);
    if (!campaign) return { ok: false, error: "Campaign not found." };
    return {
      ok: true,
      progress: {
        id: campaign.id,
        status: campaign.status,
        totalCount: campaign.totalCount,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        skippedCount: campaign.skippedCount,
        queued: Number(queued?.n ?? 0),
        finishedAt: campaign.finishedAt ? campaign.finishedAt.toISOString() : null,
      },
    };
  } catch (error) {
    return fail(error, "Could not load progress");
  }
}
