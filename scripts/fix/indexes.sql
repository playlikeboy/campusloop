-- Indexes for the eight tables AUDIT.md §3.1 flagged as bare.
--
-- The Drizzle schema (src/db/schema/*.ts) already declares every index below,
-- and drizzle/0004_content_query_indexes.sql + drizzle/0005_*.sql carry them,
-- but production has been maintained with `db:push` and one-off scripts, so
-- the live database may still be missing some of them. This file is safe to
-- run by hand as many times as needed:
--
--   psql "$DATABASE_URL" -f scripts/fix/indexes.sql
--
-- CONCURRENTLY avoids locking writes while the index builds. It cannot run
-- inside a transaction, so do not wrap this file in BEGIN/COMMIT. The next
-- `drizzle-kit generate` will also emit these for any environment that
-- applies migrations instead.

-- academic_resources (institution_id, uploader_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "academic_resources_inst_created_idx" ON "academic_resources" ("institution_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "academic_resources_uploader_created_idx" ON "academic_resources" ("uploader_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "academic_resources_type_idx" ON "academic_resources" ("resource_type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "academic_resources_branch_sem_idx" ON "academic_resources" ("branch", "semester");

-- communities (creator_id; no institution column on this table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "communities_creator_created_idx" ON "communities" ("creator_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "communities_created_idx" ON "communities" ("created_at");

-- gaming_lobbies (institution_id, host_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "gaming_institution_created_idx" ON "gaming_lobbies" ("institution_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "gaming_host_created_idx" ON "gaming_lobbies" ("host_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "gaming_game_name_idx" ON "gaming_lobbies" ("game_name");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "gaming_status_idx" ON "gaming_lobbies" ("status");

-- housing_listings (institution_id, author_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "housing_institution_created_idx" ON "housing_listings" ("institution_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "housing_author_created_idx" ON "housing_listings" ("author_id", "created_at");

-- lost_and_found_items (institution_id, author_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "lost_found_institution_created_idx" ON "lost_and_found_items" ("institution_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "lost_found_author_created_idx" ON "lost_and_found_items" ("author_id", "created_at");

-- marketplace_items (institution_id, seller_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "marketplace_institution_created_idx" ON "marketplace_items" ("institution_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "marketplace_seller_created_idx" ON "marketplace_items" ("seller_id", "created_at");

-- rideshare_pools (institution_id, creator_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "rideshare_institution_created_idx" ON "rideshare_pools" ("institution_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "rideshare_creator_created_idx" ON "rideshare_pools" ("creator_id", "created_at");

-- time_capsules (institution_id, creator_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "time_capsules_institution_created_idx" ON "time_capsules" ("institution_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "time_capsules_creator_created_idx" ON "time_capsules" ("creator_id", "created_at");
