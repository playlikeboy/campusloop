import { and, eq, inArray, lt, sql } from "drizzle-orm";
import {
  emailCampaignRecipients,
  emailCampaigns,
  emailUnsubscribes,
  institutions,
  userProfiles,
} from "@/db/schema";
import type { SendEmailOptions, SendEmailResult } from "@/lib/email";
import { type CampaignContent, type CampaignVariables, renderCampaignEmail } from "./render";
import { type Db, isDeliverableEmail, variablesForRow } from "./segments";
import { listUnsubscribeHeaders, signUnsubscribeToken, unsubscribePageUrl } from "./unsubscribe-token";

/**
 * The campaign send queue. A campaign's recipients are stored up front, one
 * row per (campaign, student) behind a unique index, then a cron route
 * (src/app/api/cron/email-campaigns) drains them in small batches.
 *
 * At-most-once delivery: a row is claimed by one atomic QUEUED -> SENDING
 * update and is never put back to QUEUED. A row stuck in SENDING (the Worker
 * died mid-send) is marked FAILED, not retried, because the email may already
 * have gone out. Enqueueing the same student twice is a no-op.
 */

export type RecipientStatus = "QUEUED" | "SENDING" | "SENT" | "FAILED" | "SKIPPED";
export type CampaignStatus = "QUEUED" | "SENDING" | "DONE" | "CANCELLED";

export interface QueueCampaign extends CampaignContent {
  id: string;
  status: CampaignStatus;
}

export interface ClaimedRecipient {
  id: string;
  campaignId: string;
  profileId: string;
  email: string;
}

export interface RecipientContext {
  email: string | null;
  status: string;
  isSeeded: boolean;
  unsubscribed: boolean;
  vars: CampaignVariables;
}

export interface RecipientResult {
  status: Exclude<RecipientStatus, "QUEUED" | "SENDING">;
  error?: string | null;
  messageId?: string | null;
}

/** Storage the queue needs. Postgres in production, an in-memory fake in tests. */
export interface QueueStore {
  insertRecipients(campaignId: string, rows: { profileId: string; email: string }[]): Promise<number>;
  activeCampaigns(): Promise<QueueCampaign[]>;
  markStarted(campaignId: string, now: Date): Promise<void>;
  failStale(campaignId: string, olderThan: Date): Promise<number>;
  /** Atomically moves up to `limit` QUEUED rows to SENDING and returns them; never returns a row twice. */
  claim(campaignId: string, limit: number): Promise<ClaimedRecipient[]>;
  context(profileIds: string[]): Promise<Map<string, RecipientContext>>;
  /** Only applies while the row is still SENDING. */
  finish(recipientId: string, result: RecipientResult, now: Date): Promise<void>;
  /** Recomputes counters; marks DONE when nothing is QUEUED or SENDING (unless CANCELLED). */
  refresh(campaignId: string, now: Date): Promise<{ remaining: number }>;
}

export type Sender = (options: SendEmailOptions) => Promise<SendEmailResult>;

export interface ProcessOptions {
  store: QueueStore;
  send: Sender;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
  batchSize?: number;
  maxBatches?: number;
  pauseMs?: number;
  /** Stop starting new batches after this long, to stay inside a request budget. */
  timeBudgetMs?: number;
  /** In production a simulated send (no provider configured) is a failure, not a success. */
  treatSimulatedAsFailure?: boolean;
  /** Unsubscribe token signer, injectable for tests. */
  signToken?: (profileId: string) => string;
}

export interface ProcessResult {
  batches: number;
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
  staleFailed: number;
  campaigns: string[];
}

export const DEFAULT_BATCH_SIZE = 50;
export const DEFAULT_MAX_BATCHES = 4;
export const DEFAULT_PAUSE_MS = 1000;
/** A row in SENDING for longer than this belongs to a run that died. */
export const STALE_SENDING_MS = 15 * 60 * 1000;
const SEND_CONCURRENCY = 5;

export const CAMPAIGN_FROM = "hello@mail.campusloop.space";
export const CAMPAIGN_FROM_NAME = "CampusLoop";

/** Enqueue is idempotent: the unique (campaign, profile) index drops repeats. */
export async function enqueueRecipients(
  store: QueueStore,
  campaignId: string,
  rows: { profileId: string; email: string }[]
): Promise<number> {
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    if (seen.has(r.profileId)) return false;
    seen.add(r.profileId);
    return true;
  });
  let inserted = 0;
  for (let i = 0; i < unique.length; i += 500) {
    inserted += await store.insertRecipients(campaignId, unique.slice(i, i + 500));
  }
  return inserted;
}

/** Builds one personalised email with unsubscribe link and List-Unsubscribe headers. */
export function buildCampaignMessage(
  campaign: CampaignContent,
  recipient: { profileId: string; email: string },
  vars: Partial<CampaignVariables>,
  signToken: (profileId: string) => string = signUnsubscribeToken
): SendEmailOptions {
  const token = signToken(recipient.profileId);
  const rendered = renderCampaignEmail(campaign, vars, { unsubscribeUrl: unsubscribePageUrl(token) });
  return {
    to: recipient.email,
    from: CAMPAIGN_FROM,
    fromName: CAMPAIGN_FROM_NAME,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    headers: listUnsubscribeHeaders(token),
  };
}

async function sendOne(
  campaign: QueueCampaign,
  r: ClaimedRecipient,
  ctx: RecipientContext | undefined,
  opts: Required<Pick<ProcessOptions, "send" | "treatSimulatedAsFailure">> & Pick<ProcessOptions, "signToken">
): Promise<RecipientResult> {
  // Re-checked at send time: things change between queueing and sending.
  if (!ctx) return { status: "SKIPPED", error: "Account no longer exists" };
  if (ctx.unsubscribed) return { status: "SKIPPED", error: "Unsubscribed" };
  if (ctx.status !== "ACTIVE") return { status: "SKIPPED", error: `Account ${ctx.status.toLowerCase()}` };
  if (ctx.isSeeded) return { status: "SKIPPED", error: "Demo account" };
  const email = ctx.email?.trim() || r.email;
  if (!isDeliverableEmail(email)) return { status: "SKIPPED", error: "No deliverable email" };

  try {
    const message = buildCampaignMessage(campaign, { profileId: r.profileId, email }, ctx.vars, opts.signToken);
    const result = await opts.send(message);
    if (!result.success) return { status: "FAILED", error: (result.error || "Send failed").slice(0, 300) };
    if (result.simulated && opts.treatSimulatedAsFailure) {
      return { status: "FAILED", error: "Email provider unavailable (send was only simulated)" };
    }
    return { status: "SENT", messageId: result.messageId ?? null, error: result.simulated ? "Simulated (no provider configured)" : null };
  } catch (error) {
    return { status: "FAILED", error: (error instanceof Error ? error.message : String(error)).slice(0, 300) };
  }
}

/** Drains queued recipients in batches across active campaigns, oldest campaign first. */
export async function processCampaignQueue(options: ProcessOptions): Promise<ProcessResult> {
  const {
    store,
    send,
    now = () => new Date(),
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    batchSize = DEFAULT_BATCH_SIZE,
    maxBatches = DEFAULT_MAX_BATCHES,
    pauseMs = DEFAULT_PAUSE_MS,
    timeBudgetMs = 25_000,
    treatSimulatedAsFailure = false,
    signToken,
  } = options;

  const startedAt = Date.now();
  const result: ProcessResult = { batches: 0, claimed: 0, sent: 0, failed: 0, skipped: 0, staleFailed: 0, campaigns: [] };
  const campaigns = await store.activeCampaigns();

  for (const campaign of campaigns) {
    result.staleFailed += await store.failStale(campaign.id, new Date(now().getTime() - STALE_SENDING_MS));
    if (campaign.status === "QUEUED") await store.markStarted(campaign.id, now());

    while (result.batches < maxBatches && Date.now() - startedAt < timeBudgetMs) {
      const claimed = await store.claim(campaign.id, batchSize);
      if (claimed.length === 0) break;
      if (!result.campaigns.includes(campaign.id)) result.campaigns.push(campaign.id);
      result.batches++;
      result.claimed += claimed.length;

      const contexts = await store.context(claimed.map((c) => c.profileId));
      for (let i = 0; i < claimed.length; i += SEND_CONCURRENCY) {
        const slice = claimed.slice(i, i + SEND_CONCURRENCY);
        const outcomes = await Promise.all(
          slice.map((r) => sendOne(campaign, r, contexts.get(r.profileId), { send, treatSimulatedAsFailure, signToken }))
        );
        for (let j = 0; j < slice.length; j++) {
          const outcome = outcomes[j];
          await store.finish(slice[j].id, outcome, now());
          if (outcome.status === "SENT") result.sent++;
          else if (outcome.status === "FAILED") result.failed++;
          else result.skipped++;
        }
      }

      const { remaining } = await store.refresh(campaign.id, now());
      if (remaining === 0) break;
      if (result.batches < maxBatches) await sleep(pauseMs);
    }

    await store.refresh(campaign.id, now());
    if (result.batches >= maxBatches || Date.now() - startedAt >= timeBudgetMs) break;
  }

  return result;
}

function isMissingEmailTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string; cause?: { code?: string; message?: string } } | null;
  return (
    e?.code === "42P01" ||
    e?.cause?.code === "42P01" ||
    /email_(campaigns|campaign_recipients|templates|unsubscribes).*does not exist/i.test(
      String(e?.message ?? e?.cause?.message ?? "")
    )
  );
}

export { isMissingEmailTable };

/** Postgres implementation of QueueStore. */
export function createDbQueueStore(db: Db): QueueStore {
  return {
    async insertRecipients(campaignId, rows) {
      if (rows.length === 0) return 0;
      const inserted = await db
        .insert(emailCampaignRecipients)
        .values(rows.map((r) => ({ campaignId, profileId: r.profileId, email: r.email.trim().toLowerCase() })))
        .onConflictDoNothing({ target: [emailCampaignRecipients.campaignId, emailCampaignRecipients.profileId] })
        .returning({ id: emailCampaignRecipients.id });
      return inserted.length;
    },

    async activeCampaigns() {
      const rows = await db
        .select({
          id: emailCampaigns.id,
          status: emailCampaigns.status,
          subject: emailCampaigns.subject,
          preheader: emailCampaigns.preheader,
          heading: emailCampaigns.heading,
          body: emailCampaigns.body,
          buttonLabel: emailCampaigns.buttonLabel,
          buttonUrl: emailCampaigns.buttonUrl,
        })
        .from(emailCampaigns)
        .where(inArray(emailCampaigns.status, ["QUEUED", "SENDING"]))
        .orderBy(emailCampaigns.createdAt)
        .limit(10);
      return rows.map((r) => ({ ...r, status: r.status as CampaignStatus }));
    },

    async markStarted(campaignId, now) {
      await db
        .update(emailCampaigns)
        .set({ status: "SENDING", startedAt: now })
        .where(and(eq(emailCampaigns.id, campaignId), eq(emailCampaigns.status, "QUEUED")));
    },

    async failStale(campaignId, olderThan) {
      const rows = await db
        .update(emailCampaignRecipients)
        .set({ status: "FAILED", error: "Interrupted while sending; not retried in case it was delivered" })
        .where(
          and(
            eq(emailCampaignRecipients.campaignId, campaignId),
            eq(emailCampaignRecipients.status, "SENDING"),
            lt(emailCampaignRecipients.updatedAt, olderThan)
          )
        )
        .returning({ id: emailCampaignRecipients.id });
      return rows.length;
    },

    async claim(campaignId, limit) {
      // One statement: SKIP LOCKED keeps two overlapping cron runs from claiming the same rows,
      // and the campaign check means a cancelled campaign never hands out work.
      const res = await db.execute(sql`
        UPDATE ${emailCampaignRecipients} AS r
        SET status = 'SENDING', attempts = r.attempts + 1, updated_at = now()
        WHERE r.id IN (
          SELECT q.id FROM ${emailCampaignRecipients} AS q
          WHERE q.campaign_id = ${campaignId} AND q.status = 'QUEUED'
          ORDER BY q.created_at, q.id
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        AND r.status = 'QUEUED'
        AND EXISTS (
          SELECT 1 FROM ${emailCampaigns} AS c
          WHERE c.id = ${campaignId} AND c.status IN ('QUEUED', 'SENDING')
        )
        RETURNING r.id, r.campaign_id, r.profile_id, r.email
      `);
      const rows = (res as unknown as { rows: Record<string, string>[] }).rows ?? [];
      return rows.map((row) => ({
        id: row.id,
        campaignId: row.campaign_id,
        profileId: row.profile_id,
        email: row.email,
      }));
    },

    async context(profileIds) {
      const map = new Map<string, RecipientContext>();
      if (profileIds.length === 0) return map;
      const [profiles, unsubs] = await Promise.all([
        db
          .select({
            id: userProfiles.id,
            email: userProfiles.email,
            status: userProfiles.status,
            isSeeded: userProfiles.isSeeded,
            displayName: userProfiles.displayName,
            officialName: userProfiles.officialName,
            username: userProfiles.username,
            collegeName: institutions.name,
          })
          .from(userProfiles)
          .leftJoin(institutions, eq(userProfiles.institutionId, institutions.id))
          .where(inArray(userProfiles.id, profileIds)),
        db
          .select({ profileId: emailUnsubscribes.profileId, email: emailUnsubscribes.email })
          .from(emailUnsubscribes)
          .where(inArray(emailUnsubscribes.profileId, profileIds)),
      ]);
      const unsubIds = new Set(unsubs.map((u) => u.profileId));
      const emails = profiles.map((p) => p.email?.trim().toLowerCase()).filter((e): e is string => Boolean(e));
      const unsubEmails = new Set<string>();
      if (emails.length > 0) {
        const byEmail = await db
          .select({ email: emailUnsubscribes.email })
          .from(emailUnsubscribes)
          .where(inArray(emailUnsubscribes.email, emails));
        for (const u of byEmail) unsubEmails.add(u.email);
      }
      for (const p of profiles) {
        map.set(p.id, {
          email: p.email,
          status: p.status,
          isSeeded: p.isSeeded,
          unsubscribed: unsubIds.has(p.id) || unsubEmails.has(p.email?.trim().toLowerCase() ?? ""),
          vars: variablesForRow(p),
        });
      }
      return map;
    },

    async finish(recipientId, outcome, now) {
      await db
        .update(emailCampaignRecipients)
        .set({
          status: outcome.status,
          error: outcome.error ?? null,
          messageId: outcome.messageId ?? null,
          sentAt: outcome.status === "SENT" ? now : null,
        })
        .where(and(eq(emailCampaignRecipients.id, recipientId), eq(emailCampaignRecipients.status, "SENDING")));
    },

    async refresh(campaignId, now) {
      const [counts] = await db
        .select({
          sent: sql<number>`count(*) filter (where ${emailCampaignRecipients.status} = 'SENT')::int`,
          failed: sql<number>`count(*) filter (where ${emailCampaignRecipients.status} = 'FAILED')::int`,
          skipped: sql<number>`count(*) filter (where ${emailCampaignRecipients.status} = 'SKIPPED')::int`,
          remaining: sql<number>`count(*) filter (where ${emailCampaignRecipients.status} in ('QUEUED', 'SENDING'))::int`,
        })
        .from(emailCampaignRecipients)
        .where(eq(emailCampaignRecipients.campaignId, campaignId));
      const remaining = Number(counts?.remaining ?? 0);
      await db
        .update(emailCampaigns)
        .set({
          sentCount: Number(counts?.sent ?? 0),
          failedCount: Number(counts?.failed ?? 0),
          skippedCount: Number(counts?.skipped ?? 0),
          ...(remaining === 0
            ? {
                status: sql`case when ${emailCampaigns.status} = 'CANCELLED' then 'CANCELLED' else 'DONE' end`,
                finishedAt: sql`coalesce(${emailCampaigns.finishedAt}, ${now.toISOString()}::timestamptz)`,
              }
            : {}),
        })
        .where(eq(emailCampaigns.id, campaignId));
      return { remaining };
    },
  };
}

/** Cancels a campaign: no new rows are claimed, and every QUEUED row becomes SKIPPED. */
export async function cancelCampaign(db: Db, campaignId: string, now: Date = new Date()): Promise<void> {
  await db
    .update(emailCampaigns)
    .set({ status: "CANCELLED", cancelledAt: now })
    .where(and(eq(emailCampaigns.id, campaignId), inArray(emailCampaigns.status, ["QUEUED", "SENDING"])));
  await db
    .update(emailCampaignRecipients)
    .set({ status: "SKIPPED", error: "Campaign cancelled" })
    .where(and(eq(emailCampaignRecipients.campaignId, campaignId), eq(emailCampaignRecipients.status, "QUEUED")));
  await createDbQueueStore(db).refresh(campaignId, now);
}
