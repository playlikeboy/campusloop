CREATE INDEX IF NOT EXISTS "communities_creator_created_idx" ON "communities" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communities_created_idx" ON "communities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gaming_institution_created_idx" ON "gaming_lobbies" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gaming_host_created_idx" ON "gaming_lobbies" USING btree ("host_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "housing_institution_created_idx" ON "housing_listings" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "housing_author_created_idx" ON "housing_listings" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lost_found_institution_created_idx" ON "lost_and_found_items" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lost_found_author_created_idx" ON "lost_and_found_items" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketplace_institution_created_idx" ON "marketplace_items" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketplace_seller_created_idx" ON "marketplace_items" USING btree ("seller_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rideshare_institution_created_idx" ON "rideshare_pools" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rideshare_creator_created_idx" ON "rideshare_pools" USING btree ("creator_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_capsules_institution_created_idx" ON "time_capsules" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_capsules_creator_created_idx" ON "time_capsules" USING btree ("creator_id","created_at");