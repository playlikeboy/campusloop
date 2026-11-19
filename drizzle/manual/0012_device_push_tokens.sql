-- 0012: Expo push tokens for the CampusLoop Android app.
-- Additive and idempotent: safe to run multiple times. Drops nothing.
-- Matches devicePushTokens in src/db/schema/users.ts.
-- Apply with: bun run scripts/db/apply-manual.ts drizzle/manual/0012_device_push_tokens.sql

CREATE TABLE IF NOT EXISTS device_push_tokens (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  expo_token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now()
);

-- One row per install; re-registering moves the token to the current account.
CREATE UNIQUE INDEX IF NOT EXISTS device_push_tokens_expo_token_idx
  ON device_push_tokens (expo_token);

-- Fan-out lookup: every token for a set of recipients.
CREATE INDEX IF NOT EXISTS device_push_tokens_profile_idx
  ON device_push_tokens (profile_id);
