import { config } from "dotenv";
config({ path: ".dev.vars" });
import { getDb } from "../src/db/index";
import { sql } from "drizzle-orm";

async function main() {
  const db = getDb();

  console.log("Creating user_mcp_keys table...");
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "user_mcp_keys" (
      "id" text PRIMARY KEY,
      "user_id" text NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
      "name" text NOT NULL DEFAULT 'Default IDE Key',
      "key" text UNIQUE NOT NULL,
      "permissions" jsonb NOT NULL DEFAULT '["read", "write", "chat", "exclusive"]'::jsonb,
      "is_active" boolean NOT NULL DEFAULT true,
      "requests_count" integer NOT NULL DEFAULT 0,
      "rate_limit_per_minute" integer NOT NULL DEFAULT 120,
      "last_used_at" timestamp with time zone,
      "created_at" timestamp with time zone NOT NULL DEFAULT now(),
      "updated_at" timestamp with time zone NOT NULL DEFAULT now()
    );
  `));

  console.log("Creating mcp_audit_logs table...");
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "mcp_audit_logs" (
      "id" text PRIMARY KEY,
      "key_id" text REFERENCES "user_mcp_keys"("id") ON DELETE SET NULL,
      "user_id" text NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
      "tool_name" text NOT NULL,
      "status" text NOT NULL,
      "latency_ms" integer,
      "client_info" text,
      "error_summary" text,
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );
  `));

  console.log("Creating indexes for user_mcp_keys & mcp_audit_logs...");
  await db.execute(sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS "user_mcp_keys_key_idx" ON "user_mcp_keys" ("key");`));
  await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "user_mcp_keys_user_idx" ON "user_mcp_keys" ("user_id");`));
  await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "mcp_audit_logs_user_created_idx" ON "mcp_audit_logs" ("user_id", "created_at");`));
  await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS "mcp_audit_logs_key_idx" ON "mcp_audit_logs" ("key_id");`));

  console.log("✅ MCP tables and indexes created successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
