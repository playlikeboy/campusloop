import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { userProfiles } from "./users";

/**
 * Admin -> Emails. Created by drizzle/manual/0017_email_campaigns.sql.
 * Campaign content is snapshotted onto the campaign row, so editing a saved
 * template never changes a campaign that is already sending.
 */
export const emailTemplates = pgTable(
  "email_templates",
  {
    id: id(),
    /** Set when the row started from a built-in preset (src/lib/email-campaigns/presets.ts). */
    presetKey: text("preset_key"),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    preheader: text("preheader").default("").notNull(),
    heading: text("heading").default("").notNull(),
    /** Simple markdown: paragraphs, **bold**, *italic*, [links](https://…), "- " lists. */
    body: text("body").default("").notNull(),
    buttonLabel: text("button_label"),
    buttonUrl: text("button_url"),
    createdById: text("created_by_id").references(() => userProfiles.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  },
  (t) => [index("email_templates_updated_idx").on(t.updatedAt)]
);

export const emailCampaigns = pgTable(
  "email_campaigns",
  {
    id: id(),
    name: text("name").notNull(),
    templateId: text("template_id").references(() => emailTemplates.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    preheader: text("preheader").default("").notNull(),
    heading: text("heading").default("").notNull(),
    body: text("body").default("").notNull(),
    buttonLabel: text("button_label"),
    buttonUrl: text("button_url"),
    /** The audience spec the recipients were resolved from (SegmentSpec). */
    segment: jsonb("segment").$type<Record<string, unknown>>().default({}).notNull(),
    /** QUEUED | SENDING | DONE | CANCELLED */
    status: text("status").default("QUEUED").notNull(),
    totalCount: integer("total_count").default(0).notNull(),
    sentCount: integer("sent_count").default(0).notNull(),
    failedCount: integer("failed_count").default(0).notNull(),
    skippedCount: integer("skipped_count").default(0).notNull(),
    lastError: text("last_error"),
    createdById: text("created_by_id").references(() => userProfiles.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("email_campaigns_status_idx").on(t.status, t.createdAt),
    index("email_campaigns_created_idx").on(t.createdAt),
  ]
);

/**
 * One row per (campaign, student). The unique index makes enqueueing
 * idempotent, and a row only moves QUEUED -> SENDING once (an atomic claim),
 * so nobody is emailed twice for the same campaign.
 */
export const emailCampaignRecipients = pgTable(
  "email_campaign_recipients",
  {
    id: id(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => emailCampaigns.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    /** QUEUED | SENDING | SENT | FAILED | SKIPPED */
    status: text("status").default("QUEUED").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    error: text("error"),
    messageId: text("message_id"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("email_campaign_recipients_campaign_profile_idx").on(t.campaignId, t.profileId),
    index("email_campaign_recipients_campaign_status_idx").on(t.campaignId, t.status, t.createdAt),
  ]
);

/** Marketing-email opt-outs. Security and account emails never read this table. */
export const emailUnsubscribes = pgTable(
  "email_unsubscribes",
  {
    id: id(),
    profileId: text("profile_id").references(() => userProfiles.id, { onDelete: "cascade" }),
    /** Lower-cased. */
    email: text("email").notNull(),
    /** LINK | ONE_CLICK | ADMIN */
    source: text("source").default("LINK").notNull(),
    campaignId: text("campaign_id"),
    createdAt,
  },
  (t) => [
    uniqueIndex("email_unsubscribes_email_idx").on(t.email),
    uniqueIndex("email_unsubscribes_profile_idx").on(t.profileId),
  ]
);

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type EmailCampaignRecipient = typeof emailCampaignRecipients.$inferSelect;
export type EmailUnsubscribe = typeof emailUnsubscribes.$inferSelect;
