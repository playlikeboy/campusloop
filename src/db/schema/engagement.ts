import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { userProfiles } from "./users";

/**
 * One row per re-engagement push the cron decided to send: streak at risk,
 * the evening campus digest, win-backs. The unique (profile, kind, local date)
 * index makes the cron idempotent, and counting a student's rows for today
 * enforces the daily cap. Created by drizzle/manual/0014_engagement_sends.sql.
 */
export const engagementSends = pgTable(
  "engagement_sends",
  {
    id: id(),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    /** STREAK_AT_RISK | DAILY_DIGEST | WINBACK_3D | WINBACK_7D */
    kind: text("kind").notNull(),
    /** YYYY-MM-DD in Asia/Kolkata. */
    localDate: text("local_date").notNull(),
    /** The exact text the student saw, so a complaint can be checked against it. */
    body: text("body"),
    createdAt,
  },
  (table) => [
    uniqueIndex("engagement_sends_profile_kind_date_idx").on(table.profileId, table.kind, table.localDate),
    index("engagement_sends_profile_date_idx").on(table.profileId, table.localDate),
  ]
);

/**
 * Growth settings that live outside user_profiles so a missing migration can
 * never break profile reads. A missing row means the defaults: reminders on,
 * no streak freezes, crush hints locked.
 */
export const engagementPrefs = pgTable("engagement_prefs", {
  profileId: text("profile_id")
    .primaryKey()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  /** False once the student turns off streak and campus reminders. */
  remindersEnabled: boolean("reminders_enabled").default(true).notNull(),
  /** Streak freezes bought with Loop Points and not used yet. */
  streakFreezes: integer("streak_freezes").default(0).notNull(),
  /** Set when the student paid Loop Points to see Secret Crush hints. */
  crushHintsUnlockedAt: timestamp("crush_hints_unlocked_at", { withTimezone: true }),
  updatedAt,
});

export type EngagementSend = typeof engagementSends.$inferSelect;
export type EngagementPrefs = typeof engagementPrefs.$inferSelect;
