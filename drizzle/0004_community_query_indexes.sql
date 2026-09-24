CREATE INDEX IF NOT EXISTS "communities_privacy_created_idx" ON "communities" USING btree ("privacy","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communities_points_created_idx" ON "communities" USING btree ("points","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_members_user_status_created_idx" ON "community_members" USING btree ("user_id","status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_members_community_status_created_idx" ON "community_members" USING btree ("community_id","status","created_at");
