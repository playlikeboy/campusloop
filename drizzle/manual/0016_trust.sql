-- 0016: Trust tiers (verified students vs unverified members), GitHub Student
-- Developer Pack verification and per-community "verified only" posting.
-- Additive and idempotent: safe to run multiple times. Drops nothing.
-- Matches src/db/schema/users.ts and src/db/schema/communities.ts.
-- Apply with: bun run scripts/db/apply-manual.ts drizzle/manual/0016_trust.sql
-- Apply BEFORE deploying the code that reads these columns.

-- How a profile became verified: 'college_email' | 'github_student' | 'admin'.
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS verification_method text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- GitHub Student Developer Pack verification. Only the GitHub user id and
-- login are kept; the OAuth access token is never stored.
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS github_user_id text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS github_login text;

-- One GitHub account can verify only one CampusLoop profile (NULLs don't collide).
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_github_user_id_idx
  ON user_profiles (github_user_id);

-- Community admins can limit posting to verified students.
ALTER TABLE communities ADD COLUMN IF NOT EXISTS verified_only_posting boolean NOT NULL DEFAULT false;

-- Backfill: everyone already verified got there through their college email.
-- Only touches rows that have no method recorded yet.
UPDATE user_profiles
   SET verification_method = 'college_email',
       verified_at = COALESCE(verified_at, updated_at, created_at)
 WHERE is_college_verified = true
   AND verification_method IS NULL;

-- Member access settings live in platform_settings under the key
-- 'member_access' (JSON). No row is needed: code defaults apply until an admin
-- saves the "Member access" page.
