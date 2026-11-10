-- 0008: Unlisted community courses + engagement-based promotion to the catalog.
-- Idempotent: safe to run multiple times.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS listed boolean NOT NULL DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS listed_at timestamp with time zone;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS wishlist_count integer NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_count integer NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS trend_score real NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS courses_listed_idx ON courses (status, listed, trend_score);
-- Curated imports (CS50) and featured courses are catalog-listed from day one.
UPDATE courses SET listed = true, listed_at = coalesce(listed_at, now()) WHERE (source <> 'COMMUNITY' OR is_featured) AND listed = false;
