import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";

export const outreachContacts = pgTable(
  "outreach_contacts",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    collegeName: text("college_name").notNull(),
    collegeSlug: text("college_slug").notNull(),
    role: text("role").default("Campus Representative").notNull(),
    status: text("status").default("PENDING").notNull(), // PENDING, SENT, DELIVERED, OPENED, REPLIED, BOUNCED, UNSUBSCRIBED
    notes: text("notes"),
    source: text("source").default("public_directory"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("outreach_contacts_email_idx").on(table.email),
    index("outreach_contacts_college_idx").on(table.collegeSlug),
    index("outreach_contacts_status_idx").on(table.status),
    index("outreach_contacts_sent_at_idx").on(table.sentAt),
  ]
);

export type OutreachContact = typeof outreachContacts.$inferSelect;
export type NewOutreachContact = typeof outreachContacts.$inferInsert;
