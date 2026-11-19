import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { oauthGrants, userProfiles } from "@/db/schema";
import { IsolateCache } from "@/lib/isolate-cache";
import { APP_SCOPE, MOBILE_CLIENT_ID } from "./config";
import { verifyJwt } from "./keys";
import { canUseFirstPartyScopes } from "./policy";
import { getClient } from "./store";

/**
 * Bearer access tokens as a full CampusLoop session, for the official Android
 * app only.
 *
 * A token is accepted when ALL of these hold:
 * - ES256 signature from our key set, issuer, expiry and `typ: at+jwt`;
 * - `client_id` (and audience) is `campusloop-android` (FULL_SESSION_CLIENTS);
 * - the first-party-only `app` scope is present;
 * - the grant (`gid`) exists, belongs to that client, and is not revoked;
 * - the client is ACTIVE and the profile is ACTIVE.
 *
 * Third-party "Login with CampusLoop" tokens fail the client and scope checks,
 * so they can only ever reach /oauth/userinfo, never /api/*.
 *
 * Results are cached per isolate for 30s, keyed by SHA-256 of the token (never
 * the raw token), and never past the token's own expiry. Revoking the app under
 * Settings > Connected apps therefore cuts the app off within 30s.
 */

/** Same shape as the Hexclave cookie path in server-cache.ts. */
export interface BearerAuthUser {
  id: string;
  primaryEmail: string | null;
  primaryEmailVerified: boolean;
  displayName: string | null;
  profileImageUrl: string | null;
}

export type BearerFailure =
  | "malformed"
  | "invalid_token"
  | "wrong_client"
  | "missing_scope"
  | "revoked"
  | "client_inactive"
  | "account_inactive";

export type BearerVerification = { ok: true; user: BearerAuthUser; profileId: string } | { ok: false; reason: BearerFailure };

const BEARER_TTL_MS = 30_000;
const bearerCache = new IsolateCache<{ user: BearerAuthUser; profileId: string; expMs: number }>(BEARER_TTL_MS, 1000);

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Extracts the token from `Authorization: Bearer <token>`; null when absent or malformed. */
export function readBearerToken(authorization: string | null | undefined): string | null {
  const m = authorization?.match(/^Bearer\s+([A-Za-z0-9_.~+/=-]+)\s*$/i);
  if (!m) return null;
  const token = m[1];
  // A compact JWS has exactly three parts; anything else is not one of ours.
  return token.length <= 4096 && token.split(".").length === 3 ? token : null;
}

export async function verifyAppBearer(token: string): Promise<BearerVerification> {
  const key = await sha256Hex(token);
  const hit = bearerCache.get(key);
  if (hit && hit.expMs > Date.now()) return { ok: true, user: hit.user, profileId: hit.profileId };

  let payload: Awaited<ReturnType<typeof verifyJwt>>;
  try {
    payload = await verifyJwt(token, { type: "at+jwt" });
  } catch {
    return { ok: false, reason: "invalid_token" };
  }

  const clientId = typeof payload.client_id === "string" ? payload.client_id : null;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!canUseFirstPartyScopes(clientId) || clientId !== MOBILE_CLIENT_ID || !aud.includes(clientId)) {
    return { ok: false, reason: "wrong_client" };
  }
  const scopes = typeof payload.scope === "string" ? payload.scope.split(/\s+/) : [];
  if (!scopes.includes(APP_SCOPE)) return { ok: false, reason: "missing_scope" };
  if (typeof payload.gid !== "string" || !payload.gid) return { ok: false, reason: "malformed" };

  const db = getDb();
  const grant = await db.query.oauthGrants.findFirst({ where: eq(oauthGrants.id, payload.gid) });
  if (!grant || grant.revokedAt || grant.clientId !== clientId) return { ok: false, reason: "revoked" };

  const client = await getClient(clientId);
  if (!client || client.status !== "ACTIVE") return { ok: false, reason: "client_inactive" };

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.id, grant.profileId),
    columns: { id: true, userId: true, email: true, displayName: true, avatarUrl: true, status: true },
  });
  if (!profile || profile.status !== "ACTIVE" || !profile.userId) return { ok: false, reason: "account_inactive" };

  const user: BearerAuthUser = {
    id: profile.userId,
    primaryEmail: profile.email ?? null,
    // Hexclave's verification flag is not on the profile row. Only onboarding
    // reads it, and /oauth/authorize requires a finished onboarding, so the
    // conservative value is fine here.
    primaryEmailVerified: false,
    displayName: profile.displayName ?? null,
    profileImageUrl: profile.avatarUrl ?? null,
  };

  const expMs = (payload.exp ?? 0) * 1000;
  if (expMs - Date.now() > 0) bearerCache.set(key, { user, profileId: profile.id, expMs });
  return { ok: true, user, profileId: profile.id };
}

/** Test hook. */
export function __clearBearerCacheForTests(): void {
  bearerCache.clear();
}
