-- 0014: Re-engagement push log and growth settings.
-- Additive and idempotent: safe to run multiple times. Drops nothing.
-- Matches engagementSends and engagementPrefs in src/db/schema/engagement.ts.
-- Apply with: bun run scripts/db/apply-manual.ts drizzle/manual/0014_engagement_sends.sql

-- One row per reminder push. The unique index makes POST /api/cron/engagement
-- idempotent: a second run on the same IST day cannot send the same kind twice.
CREATE TABLE IF NOT EXISTS engagement_sends (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  local_date text NOT NULL,
  body text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_sends_profile_kind_date_idx
  ON engagement_sends (profile_id, kind, local_date);

-- Daily cap check: how many reminders this student got today.
CREATE INDEX IF NOT EXISTS engagement_sends_profile_date_idx
  ON engagement_sends (profile_id, local_date);

-- Reminder opt-out, streak freezes and the paid crush-hint unlock.
-- Kept out of user_profiles so profile reads never depend on this migration.
CREATE TABLE IF NOT EXISTS engagement_prefs (
  profile_id text PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  reminders_enabled boolean NOT NULL DEFAULT true,
  streak_freezes integer NOT NULL DEFAULT 0,
  crush_hints_unlocked_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
