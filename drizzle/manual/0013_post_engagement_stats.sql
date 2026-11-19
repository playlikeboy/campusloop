-- 0013: per-post engagement counters for the v3 value-model feed ranker.
-- Additive and idempotent: safe to run multiple times.
-- Apply with: bun run scripts/db/apply-manual.ts drizzle/manual/0013_post_engagement_stats.sql
-- Then backfill: bun run scripts/db/backfill-post-engagement-stats.ts
-- Until this runs, the app ranks with v2 and skips counter writes.

CREATE TABLE IF NOT EXISTS post_engagement_stats (
  post_id text PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  impressions integer NOT NULL DEFAULT 0,
  dwell_ms_sum bigint NOT NULL DEFAULT 0,
  long_dwell integer NOT NULL DEFAULT 0,
  skips integer NOT NULL DEFAULT 0,
  votes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  profile_taps integer NOT NULL DEFAULT 0,
  reports integer NOT NULL DEFAULT 0,
  completions integer NOT NULL DEFAULT 0,
  loops integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Type-prior refresh reads the last 30 days of touched rows.
CREATE INDEX CONCURRENTLY IF NOT EXISTS post_engagement_stats_updated_idx
  ON post_engagement_stats (updated_at);
