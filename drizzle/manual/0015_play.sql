-- 0015: Play section (DP Battle, Meme War, Campus Trivia, This or That, badges).
-- Additive and idempotent: safe to run multiple times. Drops nothing.
-- Matches src/db/schema/play.ts.
-- Apply with: bun run scripts/db/apply-manual.ts drizzle/manual/0015_play.sql
-- Then seed content: bun run scripts/db/apply-manual.ts drizzle/manual/0015_play_seed.sql

-- DP Battle: one opt-in entry per student per IST week. Only ACTIVE rows are shown.
CREATE TABLE IF NOT EXISTS play_dp_entries (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  institution_id text NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  week_key text NOT NULL,
  image_url text NOT NULL,
  rating integer NOT NULL DEFAULT 1200,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  report_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS play_dp_entries_profile_week_idx
  ON play_dp_entries (profile_id, week_key);

CREATE INDEX IF NOT EXISTS play_dp_entries_campus_week_idx
  ON play_dp_entries (institution_id, week_key, status, rating);

-- One vote per voter per pair. Voter ids are never returned by any API.
CREATE TABLE IF NOT EXISTS play_dp_votes (
  id text PRIMARY KEY,
  week_key text NOT NULL,
  voter_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  winner_entry_id text NOT NULL REFERENCES play_dp_entries(id) ON DELETE CASCADE,
  loser_entry_id text NOT NULL REFERENCES play_dp_entries(id) ON DELETE CASCADE,
  pair_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS play_dp_votes_voter_pair_idx
  ON play_dp_votes (voter_id, pair_key);

CREATE INDEX IF NOT EXISTS play_dp_votes_voter_week_idx
  ON play_dp_votes (voter_id, week_key);

-- Meme War
CREATE TABLE IF NOT EXISTS play_meme_themes (
  id text PRIMARY KEY,
  week_key text NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS play_meme_themes_week_idx
  ON play_meme_themes (week_key);

CREATE TABLE IF NOT EXISTS play_memes (
  id text PRIMARY KEY,
  theme_id text REFERENCES play_meme_themes(id) ON DELETE SET NULL,
  week_key text NOT NULL,
  institution_id text NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  upvotes integer NOT NULL DEFAULT 0,
  report_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS play_memes_profile_week_idx
  ON play_memes (profile_id, week_key);

CREATE INDEX IF NOT EXISTS play_memes_campus_week_idx
  ON play_memes (institution_id, week_key, status, upvotes);

CREATE TABLE IF NOT EXISTS play_meme_votes (
  meme_id text NOT NULL REFERENCES play_memes(id) ON DELETE CASCADE,
  voter_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (meme_id, voter_id)
);

CREATE INDEX IF NOT EXISTS play_meme_votes_voter_idx
  ON play_meme_votes (voter_id);

-- Campus Trivia
CREATE TABLE IF NOT EXISTS play_trivia_questions (
  id text PRIMARY KEY,
  category text NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  answer_index integer NOT NULL,
  explanation text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS play_trivia_questions_question_idx
  ON play_trivia_questions (question);

CREATE INDEX IF NOT EXISTS play_trivia_questions_active_idx
  ON play_trivia_questions (is_active, category);

CREATE TABLE IF NOT EXISTS play_trivia_runs (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  institution_id text NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  local_date text NOT NULL,
  week_key text NOT NULL,
  question_ids jsonb NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_index integer NOT NULL DEFAULT 0,
  served_index integer NOT NULL DEFAULT -1,
  served_at timestamp with time zone,
  score integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'IN_PROGRESS',
  finished_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS play_trivia_runs_profile_date_idx
  ON play_trivia_runs (profile_id, local_date);

CREATE INDEX IF NOT EXISTS play_trivia_runs_campus_date_idx
  ON play_trivia_runs (institution_id, local_date, status, score);

CREATE INDEX IF NOT EXISTS play_trivia_runs_campus_week_idx
  ON play_trivia_runs (institution_id, week_key, status);

-- This or That
CREATE TABLE IF NOT EXISTS play_tot_prompts (
  id text PRIMARY KEY,
  option_a text NOT NULL,
  option_b text NOT NULL,
  category text NOT NULL DEFAULT 'CAMPUS',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS play_tot_prompts_pair_idx
  ON play_tot_prompts (option_a, option_b);

CREATE TABLE IF NOT EXISTS play_tot_votes (
  prompt_id text NOT NULL REFERENCES play_tot_prompts(id) ON DELETE CASCADE,
  voter_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  institution_id text NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  week_key text NOT NULL,
  choice text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (prompt_id, voter_id)
);

CREATE INDEX IF NOT EXISTS play_tot_votes_prompt_campus_idx
  ON play_tot_votes (prompt_id, institution_id, choice);

CREATE INDEX IF NOT EXISTS play_tot_votes_campus_week_idx
  ON play_tot_votes (institution_id, week_key);

CREATE INDEX IF NOT EXISTS play_tot_votes_voter_idx
  ON play_tot_votes (voter_id, created_at);

-- Reports on DP entries and memes. Three reports hide the item.
CREATE TABLE IF NOT EXISTS play_reports (
  id text PRIMARY KEY,
  target_type text NOT NULL,
  target_id text NOT NULL,
  reporter_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS play_reports_target_reporter_idx
  ON play_reports (target_type, target_id, reporter_id);

CREATE INDEX IF NOT EXISTS play_reports_created_idx
  ON play_reports (created_at);

-- Badges. context is '' for one-time badges and the week key for weekly ones.
CREATE TABLE IF NOT EXISTS play_achievements (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  context text NOT NULL DEFAULT '',
  points_awarded integer NOT NULL DEFAULT 0,
  awarded_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS play_achievements_unique_idx
  ON play_achievements (profile_id, achievement_key, context);

CREATE INDEX IF NOT EXISTS play_achievements_profile_idx
  ON play_achievements (profile_id, awarded_at);
