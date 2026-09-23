import { config } from "dotenv";
config({ path: ".dev.vars" });
import { getDb } from "../src/db/index";
import { sql } from "drizzle-orm";

async function main() {
  const db = getDb();

  console.log("Creating community_webhooks table...");
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "community_webhooks" (
      "id" text PRIMARY KEY,
      "community_id" text NOT NULL REFERENCES "communities"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "token" text UNIQUE NOT NULL,
      "bot_name" text NOT NULL DEFAULT 'CampusBot',
      "avatar_url" text,
      "is_active" boolean NOT NULL DEFAULT true,
      "created_by_id" text NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
      "posts_count" integer NOT NULL DEFAULT 0,
      "last_used_at" timestamp with time zone,
      "created_at" timestamp with time zone NOT NULL DEFAULT now(),
      "updated_at" timestamp with time zone NOT NULL DEFAULT now()
    );
  `));

  console.log("Creating community_webhooks indexes...");
  await db.execute(sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS "community_webhooks_token_idx" ON "community_webhooks" ("token");`));
  await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "community_webhooks_community_idx" ON "community_webhooks" ("community_id");`));

  console.log("✅ community_webhooks table created successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
