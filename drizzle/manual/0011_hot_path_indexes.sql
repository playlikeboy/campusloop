-- 0006: hot-path indexes for feed ranking, events listing, communities and memberships.
-- Idempotent: safe to run multiple times.
-- CONCURRENTLY: builds without blocking writes; run outside a transaction,
-- one statement per call (scripts/db/apply-manual.ts does this).
--
-- votes_post_created_idx and comments_post_status_created_idx were first
-- created by 0002 (without CONCURRENTLY). They are repeated here under the
-- same names so this file describes the full hot-path set; IF NOT EXISTS
-- makes them no-ops where 0002 already ran.

-- Per-target behaviour lookups (e.g. view counts / dwell for a post).
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_behavior_events_target_id_type_idx
  ON user_behavior_events (target_id, event_type);

-- Recent-vote and recent-comment counts per candidate post in feed ranking.
CREATE INDEX CONCURRENTLY IF NOT EXISTS votes_post_created_idx
  ON votes (post_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS comments_post_status_created_idx
  ON comments (post_id, status, created_at);

-- Global feed ordered by recency for any status filter (0002's
-- posts_published_created_idx only covers status = 'PUBLISHED').
CREATE INDEX CONCURRENTLY IF NOT EXISTS posts_status_created_idx
  ON posts (status, created_at DESC);

-- Events listing (upcoming published events) and per-campus events.
CREATE INDEX CONCURRENTLY IF NOT EXISTS events_status_start_idx
  ON events (status, start_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS events_institution_idx
  ON events (institution_id);

-- "My communities": community_members_join_idx leads with community_id,
-- so lookups by user_id alone cannot use it.
CREATE INDEX CONCURRENTLY IF NOT EXISTS community_members_user_idx
  ON community_members (user_id);

-- Community leaderboard / top communities.
CREATE INDEX CONCURRENTLY IF NOT EXISTS communities_points_idx
  ON communities (points DESC);
