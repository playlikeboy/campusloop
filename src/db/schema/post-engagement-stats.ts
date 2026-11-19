import { bigint, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { posts } from "./posts";

/**
 * Per-post engagement counters for the v3 value-model ranker.
 *
 * Precomputed so the feed scores a candidate with one indexed join instead of
 * several correlated subqueries per row. Rows are created lazily (upsert) by
 * /api/feed/impressions, the vote/comment/save routes and reel telemetry, and
 * backfilled once by scripts/db/backfill-post-engagement-stats.ts.
 *
 * Created by drizzle/manual/0013_post_engagement_stats.sql. Every reader and
 * writer tolerates the table being absent and falls back to ranking v2.
 */
export const postEngagementStats = pgTable(
  "post_engagement_stats",
  {
    postId: text("post_id")
      .primaryKey()
      .references(() => posts.id, { onDelete: "cascade" }),
    /** Feed impressions (post at least half on screen for 300ms+). */
    impressions: integer("impressions").default(0).notNull(),
    /** Sum of on-screen time, each impression capped at 120s. */
    dwellMsSum: bigint("dwell_ms_sum", { mode: "number" }).default(0).notNull(),
    /** Impressions that reached 8s on screen. */
    longDwell: integer("long_dwell").default(0).notNull(),
    /** Impressions under 1.2s: scrolled straight past. */
    skips: integer("skips").default(0).notNull(),
    /** Upvotes. */
    votes: integer("votes").default(0).notNull(),
    comments: integer("comments").default(0).notNull(),
    shares: integer("shares").default(0).notNull(),
    saves: integer("saves").default(0).notNull(),
    profileTaps: integer("profile_taps").default(0).notNull(),
    reports: integer("reports").default(0).notNull(),
    /** Video posts: watched to the end at least once. */
    completions: integer("completions").default(0).notNull(),
    /** Video posts: extra loops beyond the first watch. */
    loops: integer("loops").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("post_engagement_stats_updated_idx").on(table.updatedAt)]
);

export type PostEngagementStats = typeof postEngagementStats.$inferSelect;
