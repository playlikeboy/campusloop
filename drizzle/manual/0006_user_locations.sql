-- 0006: per-student last known location (IP city-level or opt-in GPS rounded to ~1 km).
-- Separate table so whole-profile queries never carry coordinates.
-- Idempotent: safe to run multiple times.
CREATE TABLE IF NOT EXISTS user_locations (
  profile_id text PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  source text NOT NULL,
  country text,
  region text,
  city text,
  latitude double precision,
  longitude double precision,
  accuracy_m integer,
  gps_updated_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_locations_lat_lng_idx ON user_locations (latitude, longitude);
