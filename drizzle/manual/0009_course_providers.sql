-- 0009: Course providers (universities, YouTube educators) and source-based ranking boost.
-- Idempotent: safe to run multiple times.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rank_boost real NOT NULL DEFAULT 0;
UPDATE courses SET provider = 'Harvard CS50', rank_boost = 1 WHERE source = 'CS50';
CREATE INDEX IF NOT EXISTS courses_provider_idx ON courses (provider);
