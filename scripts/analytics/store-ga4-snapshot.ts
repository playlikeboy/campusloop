/**
 * Store a GA4 traffic snapshot in platform_settings (key "ga4_snapshot").
 * The admin analytics page reads it when live Composio access is not configured.
 *
 *   bun run scripts/analytics/store-ga4-snapshot.ts path/to/ga4-snapshot.json
 *
 * Idempotent: upserts that one key only. Touches no other row.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const KEY = "ga4_snapshot";

const file = process.argv[2];
if (!file) {
  console.error("Usage: bun run scripts/analytics/store-ga4-snapshot.ts <snapshot.json>");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL ?? process.env.DB_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL / DB_URL");
  process.exit(1);
}

const snapshot = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
for (const field of ["fetchedAt", "totals", "daily"]) {
  if (!(field in snapshot)) {
    console.error(`Snapshot is missing "${field}"`);
    process.exit(1);
  }
}

const sql = neon(databaseUrl);
const value = JSON.stringify(snapshot);
await sql`
  insert into platform_settings (key, value, updated_at)
  values (${KEY}, ${value}, now())
  on conflict (key) do update set value = excluded.value, updated_at = now()
`;
console.log(`Stored ${KEY} (${value.length} bytes, fetchedAt ${String(snapshot.fetchedAt)})`);
