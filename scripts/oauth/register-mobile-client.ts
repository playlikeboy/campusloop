/**
 * Registers the official CampusLoop Android app as a Login with CampusLoop client:
 * PUBLIC (no secret, PKCE required), first-party (no consent screen), the only
 * client allowed the `app` scope (full session on /api/*; see src/lib/oauth/bearer.ts).
 *
 *   bun --env-file=.env scripts/oauth/register-mobile-client.ts --dry-run   # show what would change, write nothing
 *   bun --env-file=.env scripts/oauth/register-mobile-client.ts             # insert or update the row
 *
 * Idempotent: re-running updates the same row (client_id "campusloop-android").
 * There is no secret to print.
 */
import { neon } from "@neondatabase/serverless";
import { APP_SCOPE, MOBILE_CLIENT_ID, MOBILE_REDIRECT_URI, SENSITIVE_SCOPES, SUPPORTED_SCOPES } from "../../src/lib/oauth/config";

const dryRun = process.argv.includes("--dry-run");
const url = process.env.DB_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DB_URL (or DATABASE_URL) is not set. Run with: bun --env-file=.env scripts/oauth/register-mobile-client.ts [--dry-run]");
  process.exit(1);
}

const row = {
  id: MOBILE_CLIENT_ID,
  name: "CampusLoop for Android",
  description: "The official CampusLoop app.",
  homepage_url: "https://campusloop.space",
  privacy_url: "https://campusloop.space/privacy",
  terms_url: "https://campusloop.space/terms",
  redirect_uris: [MOBILE_REDIRECT_URI],
  type: "PUBLIC",
  requested_scopes: [...SUPPORTED_SCOPES, APP_SCOPE],
  approved_scopes: SENSITIVE_SCOPES,
  review_status: "APPROVED",
  is_first_party: true,
  sector: "campusloop",
  status: "ACTIVE",
};

const sql = neon(url);
const existing = (await sql`
  select id, name, type, redirect_uris, requested_scopes, approved_scopes, review_status, is_first_party, sector, status,
         client_secret_hash is not null as has_secret
  from oauth_clients where id = ${row.id}`) as Record<string, unknown>[];

console.log(existing.length ? "existing row:" : "no existing row; will insert");
if (existing.length) console.log(JSON.stringify(existing[0], null, 2));
console.log("target row:");
console.log(JSON.stringify(row, null, 2));

if (dryRun) {
  console.log("[dry run] nothing written.");
  process.exit(0);
}

await sql`
  insert into oauth_clients (id, name, description, homepage_url, privacy_url, terms_url, redirect_uris, type, client_secret_hash, secret_last4,
    requested_scopes, approved_scopes, review_status, is_first_party, sector, status)
  values (${row.id}, ${row.name}, ${row.description}, ${row.homepage_url}, ${row.privacy_url}, ${row.terms_url},
    ${JSON.stringify(row.redirect_uris)}::jsonb, 'PUBLIC', null, null,
    ${JSON.stringify(row.requested_scopes)}::jsonb, ${JSON.stringify(row.approved_scopes)}::jsonb, 'APPROVED', true, 'campusloop', 'ACTIVE')
  on conflict (id) do update set name = excluded.name, description = excluded.description, homepage_url = excluded.homepage_url,
    privacy_url = excluded.privacy_url, terms_url = excluded.terms_url, redirect_uris = excluded.redirect_uris,
    type = 'PUBLIC', client_secret_hash = null, secret_last4 = null,
    requested_scopes = excluded.requested_scopes, approved_scopes = excluded.approved_scopes,
    review_status = 'APPROVED', is_first_party = true, sector = 'campusloop', status = 'ACTIVE', updated_at = now()`;
console.log(`registered client_id=${row.id} (PUBLIC, PKCE, redirect ${MOBILE_REDIRECT_URI})`);
