import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { userProfiles } from "./users";

/**
 * Authoritative user streak summary.
 * Maintained atomically whenever a student performs a qualifying campus action.
 */
export const userStreaks = pgTable(
  "user_streaks",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    currentStreak: integer("current_streak").default(0).notNull(),
    longestStreak: integer("longest_streak").default(0).notNull(),
    lastQualifiedDate: text("last_qualified_date"), // YYYY-MM-DD in user's local timezone (Asia/Kolkata)
    totalQualifiedDays: integer("total_qualified_days").default(0).notNull(),
    streakStartedAt: timestamp("streak_started_at", { withTimezone: true }),
    longestStreakStartedAt: timestamp("longest_streak_started_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("user_streaks_user_id_idx").on(table.userId),
    index("user_streaks_current_streak_idx").on(table.currentStreak),
  ]
);

export type UserStreak = typeof userStreaks.$inferSelect;
export type NewUserStreak = typeof userStreaks.$inferInsert;

/**
 * Atomic streak event journal.
 * The unique index on (user_id, local_date) strictly enforces the single-qualifying-action-per-day
 * invariant, eliminating multi-tab and race-condition double counting.
 */
export const streakEvents = pgTable(
  "streak_events",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    localDate: text("local_date").notNull(), // YYYY-MM-DD
    eventType: text("event_type").notNull(), // POST_CREATE, POLL_VOTE, ACADEMIC_UPLOAD, etc.
    sourceEntityId: text("source_entity_id"),
    createdAt,
  },
  (table) => [
    uniqueIndex("streak_events_user_local_date_idx").on(table.userId, table.localDate),
    index("streak_events_user_created_idx").on(table.userId, table.createdAt),
    index("streak_events_local_date_idx").on(table.localDate),
  ]
);

export type StreakEvent = typeof streakEvents.$inferSelect;
export type NewStreakEvent = typeof streakEvents.$inferInsert;

/**
 * Historical milestones unlocked by the student.
 * Guarantees milestone Loop Points rewards can never be double-claimed.
 */
export const userStreakMilestones = pgTable(
  "user_streak_milestones",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    milestoneDays: integer("milestone_days").notNull(), // 3, 7, 14, 30, 60, 100, 180, 365
    pointsAwarded: integer("points_awarded").notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_streak_milestones_user_days_idx").on(table.userId, table.milestoneDays),
    index("user_streak_milestones_user_idx").on(table.userId),
  ]
);

export type UserStreakMilestone = typeof userStreakMilestones.$inferSelect;
export type NewUserStreakMilestone = typeof userStreakMilestones.$inferInsert;
