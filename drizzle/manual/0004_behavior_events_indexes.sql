-- 0004: indexes for per-viewer ranking reads and experiment rollups on user_behavior_events.
-- Idempotent: safe to run multiple times.
-- CONCURRENTLY: builds without blocking writes; run outside a transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_behavior_events_user_type_created_idx
  ON user_behavior_events (user_id, event_type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_behavior_events_type_created_idx
  ON user_behavior_events (event_type, created_at);
