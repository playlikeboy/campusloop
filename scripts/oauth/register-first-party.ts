/**
 * Registers CampusLoop ecosystem apps as first-party Login with CampusLoop
 * clients: approved for every scope, sharing the "campusloop" pairwise sector
 * (so all ecosystem apps see the same `sub` for a student).
 *
 *   bun --env-file=.env scripts/oauth/register-first-party.ts <key> <name> <redirect_uri>[,<redirect_uri>...] [homepage]
 *   e.g. bun --env-file=.env scripts/oauth/register-first-party.ts dsaloop DSALoop https://dsaloop.campusloop.space/api/auth/callback/campusloop https://dsaloop.campusloop.space
 *
 * Prints the client_id and a new client_secret once. Re-running for the same key rotates the secret.
 */
import { neon } from "@neondatabase/serverless";
import { SENSITIVE_SCOPES, SUPPORTED_SCOPES } from "../../src/lib/oauth/config";
import { sha256, randomToken } from "../../src/lib/oauth/crypto";
import { isValidRedirectUri } from "../../src/lib/oauth/policy";

const [key, name, uris, homepage] = process.argv.slice(2);
if (!key || !name || !uris) {
  console.error("usage: register-first-party.ts <key> <name> <redirect_uri,...> [homepage]");
  process.exit(1);
}
const redirectUris = uris.split(",").map((u) => u.trim());
const bad = redirectUris.filter((u) => !isValidRedirectUri(u));
if (bad.length) {
  console.error(`invalid redirect URIs: ${bad.join(", ")}`);
  process.exit(1);
}

const sql = neon((process.env.DB_URL ?? process.env.DATABASE_URL) as string);
const id = `cl_app_${key.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
const secret = randomToken("cl_secret_");
await sql`
  insert into oauth_clients (id, name, homepage_url, redirect_uris, type, client_secret_hash, secret_last4, requested_scopes, approved_scopes, review_status, is_first_party, sector)
  values (${id}, ${name}, ${homepage ?? null}, ${JSON.stringify(redirectUris)}::jsonb, 'CONFIDENTIAL', ${await sha256(secret)}, ${secret.slice(-4)},
    ${JSON.stringify(SUPPORTED_SCOPES)}::jsonb, ${JSON.stringify(SENSITIVE_SCOPES)}::jsonb, 'APPROVED', true, 'campusloop')
  on conflict (id) do update set name = excluded.name, homepage_url = excluded.homepage_url, redirect_uris = excluded.redirect_uris,
    client_secret_hash = excluded.client_secret_hash, secret_last4 = excluded.secret_last4, approved_scopes = excluded.approved_scopes,
    review_status = 'APPROVED', is_first_party = true, sector = 'campusloop', status = 'ACTIVE', updated_at = now()`;
console.log(`client_id=${id}`);
console.log(`client_secret=${secret}   (shown once; store it in the app's secrets)`);
