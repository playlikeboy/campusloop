-- 1. Gaming Lobbies Indexes
CREATE INDEX IF NOT EXISTS "gaming_game_name_idx" ON "gaming_lobbies" ("game_name");
CREATE INDEX IF NOT EXISTS "gaming_status_idx" ON "gaming_lobbies" ("status");

-- 2. Gaming Lobby Members (normalized unique membership table)
CREATE TABLE IF NOT EXISTS "gaming_lobby_members" (
  "id" text PRIMARY KEY NOT NULL,
  "lobby_id" text NOT NULL REFERENCES "gaming_lobbies"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "role" text,
  "gamer_tag" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "gaming_lobby_members_unique_idx" ON "gaming_lobby_members" ("lobby_id", "user_id");
CREATE INDEX IF NOT EXISTS "gaming_lobby_members_lobby_idx" ON "gaming_lobby_members" ("lobby_id");
CREATE INDEX IF NOT EXISTS "gaming_lobby_members_user_idx" ON "gaming_lobby_members" ("user_id");

-- 3. Gamer Profiles & Teammate Preferences (LFT)
CREATE TABLE IF NOT EXISTS "gamer_profiles" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "institution_id" text NOT NULL REFERENCES "institutions"("id") ON DELETE CASCADE,
  "primary_game" text DEFAULT 'Valorant' NOT NULL,
  "games" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "platforms" jsonb DEFAULT '["PC"]'::jsonb NOT NULL,
  "play_style" text DEFAULT 'BOTH' NOT NULL,
  "preferred_availability" text DEFAULT 'EVENING' NOT NULL,
  "voice_preference" text DEFAULT 'DISCORD' NOT NULL,
  "is_looking_for_team" boolean DEFAULT true NOT NULL,
  "is_handle_public" boolean DEFAULT true NOT NULL,
  "bio" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "gamer_profiles_user_idx" ON "gamer_profiles" ("user_id");
CREATE INDEX IF NOT EXISTS "gamer_profiles_institution_idx" ON "gamer_profiles" ("institution_id");
CREATE INDEX IF NOT EXISTS "gamer_profiles_primary_game_idx" ON "gamer_profiles" ("primary_game");
CREATE INDEX IF NOT EXISTS "gamer_profiles_lft_idx" ON "gamer_profiles" ("is_looking_for_team");

-- 4. Gaming Tournaments
CREATE TABLE IF NOT EXISTS "gaming_tournaments" (
  "id" text PRIMARY KEY NOT NULL,
  "institution_id" text REFERENCES "institutions"("id") ON DELETE CASCADE,
  "organizer_id" text NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "game_name" text NOT NULL,
  "format" text DEFAULT 'SINGLE_ELIMINATION' NOT NULL,
  "team_format" text DEFAULT 'SOLO' NOT NULL,
  "max_participants" integer DEFAULT 8 NOT NULL,
  "current_participants" integer DEFAULT 0 NOT NULL,
  "registration_deadline" timestamp with time zone NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "rules" text,
  "prize_pool" text,
  "status" text DEFAULT 'REGISTRATION_OPEN' NOT NULL,
  "banner_url" text,
  "bracket_data" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "gaming_tournaments_slug_idx" ON "gaming_tournaments" ("slug");
CREATE INDEX IF NOT EXISTS "gaming_tournaments_institution_idx" ON "gaming_tournaments" ("institution_id");
CREATE INDEX IF NOT EXISTS "gaming_tournaments_status_idx" ON "gaming_tournaments" ("status");
CREATE INDEX IF NOT EXISTS "gaming_tournaments_game_idx" ON "gaming_tournaments" ("game_name");
CREATE INDEX IF NOT EXISTS "gaming_tournaments_starts_at_idx" ON "gaming_tournaments" ("starts_at");

-- 5. Gaming Tournament Entries
CREATE TABLE IF NOT EXISTS "gaming_tournament_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "tournament_id" text NOT NULL REFERENCES "gaming_tournaments"("id") ON DELETE CASCADE,
  "captain_id" text NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "team_name" text NOT NULL,
  "roster" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "seed" integer,
  "is_checked_in" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'REGISTERED' NOT NULL,
  "final_rank" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "gaming_tournament_entries_unique_idx" ON "gaming_tournament_entries" ("tournament_id", "captain_id");
CREATE INDEX IF NOT EXISTS "gaming_tournament_entries_tournament_idx" ON "gaming_tournament_entries" ("tournament_id");
CREATE INDEX IF NOT EXISTS "gaming_tournament_entries_captain_idx" ON "gaming_tournament_entries" ("captain_id");

-- 6. Gaming Tournament Matches
CREATE TABLE IF NOT EXISTS "gaming_tournament_matches" (
  "id" text PRIMARY KEY NOT NULL,
  "tournament_id" text NOT NULL REFERENCES "gaming_tournaments"("id") ON DELETE CASCADE,
  "round_number" integer NOT NULL,
  "match_number" integer NOT NULL,
  "next_match_id" text,
  "entry1_id" text REFERENCES "gaming_tournament_entries"("id") ON DELETE SET NULL,
  "entry2_id" text REFERENCES "gaming_tournament_entries"("id") ON DELETE SET NULL,
  "winner_id" text REFERENCES "gaming_tournament_entries"("id") ON DELETE SET NULL,
  "score1" integer DEFAULT 0 NOT NULL,
  "score2" integer DEFAULT 0 NOT NULL,
  "reported_by_entry_id" text,
  "reported_by_user_id" text,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "dispute_reason" text,
  "scheduled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "gaming_matches_tournament_round_idx" ON "gaming_tournament_matches" ("tournament_id", "round_number", "match_number");
CREATE INDEX IF NOT EXISTS "gaming_matches_tournament_status_idx" ON "gaming_tournament_matches" ("tournament_id", "status");

-- 7. Gaming Progression & Seasonal Leaderboard
CREATE TABLE IF NOT EXISTS "gaming_progression" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "institution_id" text NOT NULL REFERENCES "institutions"("id") ON DELETE CASCADE,
  "game_name" text NOT NULL,
  "matches_played" integer DEFAULT 0 NOT NULL,
  "matches_won" integer DEFAULT 0 NOT NULL,
  "tournaments_won" integer DEFAULT 0 NOT NULL,
  "tournaments_played" integer DEFAULT 0 NOT NULL,
  "fair_play_honors" integer DEFAULT 0 NOT NULL,
  "ranking_points" integer DEFAULT 1000 NOT NULL,
  "season" text DEFAULT '2026-S1' NOT NULL,
  "is_opted_out" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "gaming_progression_user_game_season_idx" ON "gaming_progression" ("user_id", "game_name", "season");
CREATE INDEX IF NOT EXISTS "gaming_progression_institution_game_idx" ON "gaming_progression" ("institution_id", "game_name", "ranking_points");
CREATE INDEX IF NOT EXISTS "gaming_progression_ranking_points_idx" ON "gaming_progression" ("game_name", "ranking_points");
