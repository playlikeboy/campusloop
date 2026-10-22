import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { type OauthClient, type OauthGrant, oauthClients, oauthCodes, oauthGrants, oauthRefreshTokens, userProfiles } from "@/db/schema";
import { isCollegeVerifiedUser } from "@/lib/user-verification";
import { claimsFor, type ClaimProfile, pairwiseSub } from "./claims";
import { TTL } from "./config";
import { randomToken, safeEqual, sha256, verifyPkce } from "./crypto";
import { OAuthError } from "./errors";
import { signJwt, verifyJwt } from "./keys";

/** Database side of the OAuth server: clients, codes, grants and tokens. */

export async function getClient(clientId: string | null | undefined): Promise<OauthClient | null> {
  if (!clientId || clientId.length > 100) return null;
  return (await getDb().query.oauthClients.findFirst({ where: eq(oauthClients.id, clientId) })) ?? null;
}

export function assertClientActive(client: OauthClient | null): asserts client is OauthClient {
  if (!client) throw new OAuthError("invalid_client", "Unknown client", 401);
  if (client.status !== "ACTIVE") throw new OAuthError("unauthorized_client", "This app has been suspended", 400);
}

/** New client secret: shown once, stored as a hash. */
export async function newClientSecret() {
  const secret = randomToken("cl_secret_");
  return { secret, hash: await sha256(secret), last4: secret.slice(-4) };
}

export const newClientId = () => randomToken("cl_app_", 12);

/**
 * Token-endpoint client authentication: client_secret_basic, client_secret_post,
 * or "none" for PUBLIC clients (which must then use PKCE).
 */
export async function authenticateClient(authHeader: string | null, body: URLSearchParams): Promise<OauthClient> {
  let id = body.get("client_id");
  let secret = body.get("client_secret");
  if (authHeader?.startsWith("Basic ")) {
    try {
      const [u, p] = atob(authHeader.slice(6)).split(":");
      id = decodeURIComponent(u ?? "");
      secret = decodeURIComponent(p ?? "");
    } catch {
      throw new OAuthError("invalid_client", "Malformed Basic credentials", 401);
    }
  }
  const client = await getClient(id);
  assertClientActive(client);
  if (client.type === "CONFIDENTIAL") {
    if (!secret || !client.clientSecretHash || !safeEqual(await sha256(secret), client.clientSecretHash)) {
      throw new OAuthError("invalid_client", "Client authentication failed", 401);
    }
  }
  return client;
}

export async function createCode(input: {
  client: OauthClient;
  profileId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge: string | null;
  nonce: string | null;
}): Promise<string> {
  const code = randomToken("cl_code_");
  await getDb()
    .insert(oauthCodes)
    .values({
      codeHash: await sha256(code),
      clientId: input.client.id,
      profileId: input.profileId,
      redirectUri: input.redirectUri,
      scopes: input.scopes,
      codeChallenge: input.codeChallenge,
      nonce: input.nonce,
      expiresAt: new Date(Date.now() + TTL.codeSec * 1000),
    });
  return code;
}

/** Single-use code exchange with PKCE and redirect URI binding. A replayed code revokes the grant's refresh tokens. */
export async function exchangeCode(input: { client: OauthClient; code: string; redirectUri: string | null; codeVerifier: string | null }) {
  const db = getDb();
  const codeHash = await sha256(input.code);
  const [row] = await db
    .update(oauthCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(oauthCodes.codeHash, codeHash), isNull(oauthCodes.usedAt), gt(oauthCodes.expiresAt, new Date())))
    .returning();
  if (!row) {
    const used = await db.query.oauthCodes.findFirst({ where: eq(oauthCodes.codeHash, codeHash) });
    if (used?.usedAt) await revokeGrantTokens(used.clientId, used.profileId);
    throw new OAuthError("invalid_grant", "Authorization code is invalid, expired or already used");
  }
  if (row.clientId !== input.client.id) throw new OAuthError("invalid_grant", "Code was issued to another client");
  if (row.redirectUri !== input.redirectUri) throw new OAuthError("invalid_grant", "redirect_uri does not match the authorization request");
  if (row.codeChallenge) {
    if (!input.codeVerifier || !(await verifyPkce(input.codeVerifier, row.codeChallenge))) throw new OAuthError("invalid_grant", "PKCE verification failed");
  } else if (input.client.type === "PUBLIC") {
    throw new OAuthError("invalid_grant", "Public clients must use PKCE");
  }
  return row;
}

/** Records consent (merging scopes). Counts the app's unique users. */
export async function upsertGrant(clientId: string, profileId: string, scopes: string[]): Promise<OauthGrant> {
  const db = getDb();
  const existing = await db.query.oauthGrants.findFirst({ where: and(eq(oauthGrants.clientId, clientId), eq(oauthGrants.profileId, profileId)) });
  if (existing) {
    const merged = existing.revokedAt ? scopes : [...new Set([...existing.scopes, ...scopes])];
    const [g] = await db
      .update(oauthGrants)
      .set({ scopes: merged, revokedAt: null, lastUsedAt: new Date(), updatedAt: new Date() })
      .where(eq(oauthGrants.id, existing.id))
      .returning();
    return g;
  }
  const [g] = await db.insert(oauthGrants).values({ clientId, profileId, scopes, lastUsedAt: new Date() }).returning();
  await db.update(oauthClients).set({ usersCount: sql`${oauthClients.usersCount} + 1` }).where(eq(oauthClients.id, clientId));
  return g;
}

export async function getActiveGrant(clientId: string, profileId: string): Promise<OauthGrant | null> {
  const g = await getDb().query.oauthGrants.findFirst({ where: and(eq(oauthGrants.clientId, clientId), eq(oauthGrants.profileId, profileId)) });
  return g && !g.revokedAt ? g : null;
}

export async function revokeGrantTokens(clientId: string, profileId: string) {
  await getDb()
    .update(oauthRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(oauthRefreshTokens.clientId, clientId), eq(oauthRefreshTokens.profileId, profileId), isNull(oauthRefreshTokens.revokedAt)));
}

/** Revokes consent and every refresh token for it (Connected apps, Revoke). */
export async function revokeGrant(clientId: string, profileId: string) {
  await getDb()
    .update(oauthGrants)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(oauthGrants.clientId, clientId), eq(oauthGrants.profileId, profileId)));
  await revokeGrantTokens(clientId, profileId);
}

export async function loadClaimProfile(profileId: string): Promise<ClaimProfile | null> {
  const p = await getDb().query.userProfiles.findFirst({ where: eq(userProfiles.id, profileId), with: { institution: true } });
  if (!p || p.status !== "ACTIVE") return null;
  return {
    username: p.username,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    email: p.email,
    branch: p.branch,
    course: p.course,
    year: p.year,
    studentVerified: isCollegeVerifiedUser(p),
    institution: p.institution ? { id: p.institution.id, name: p.institution.name, slug: p.institution.slug, state: p.institution.state } : null,
  };
}

/** Issues access + id tokens, and a rotating refresh token when offline_access was granted. */
export async function issueTokens(input: { client: OauthClient; grant: OauthGrant; scopes: string[]; nonce?: string | null; familyId?: string }) {
  const { client, grant, scopes } = input;
  const profile = await loadClaimProfile(grant.profileId);
  if (!profile) throw new OAuthError("invalid_grant", "The account is no longer active");
  const sub = await pairwiseSub(grant.profileId, client);
  const scope = scopes.join(" ");
  const accessToken = await signJwt({ sub, client_id: client.id, scope, gid: grant.id }, { audience: client.id, expiresInSec: TTL.accessTokenSec, type: "at+jwt" });
  const body: Record<string, unknown> = { access_token: accessToken, token_type: "Bearer", expires_in: TTL.accessTokenSec, scope };
  if (scopes.includes("openid")) {
    body.id_token = await signJwt(
      { sub, ...(input.nonce ? { nonce: input.nonce } : {}), auth_time: Math.floor(Date.now() / 1000), ...claimsFor(profile, scopes) },
      { audience: client.id, expiresInSec: TTL.idTokenSec }
    );
  }
  if (scopes.includes("offline_access")) {
    const refresh = randomToken("cl_rt_");
    await getDb()
      .insert(oauthRefreshTokens)
      .values({
        tokenHash: await sha256(refresh),
        familyId: input.familyId ?? crypto.randomUUID(),
        clientId: client.id,
        profileId: grant.profileId,
        scopes,
        expiresAt: new Date(Date.now() + TTL.refreshTokenSec * 1000),
      });
    body.refresh_token = refresh;
  }
  await getDb().update(oauthGrants).set({ lastUsedAt: new Date() }).where(eq(oauthGrants.id, grant.id));
  return body;
}

/** Refresh-token rotation. Reusing an already-rotated token revokes its whole family (stolen-token defence). */
export async function refreshTokens(input: { client: OauthClient; refreshToken: string; scope: string | null }) {
  const db = getDb();
  const row = await db.query.oauthRefreshTokens.findFirst({ where: eq(oauthRefreshTokens.tokenHash, await sha256(input.refreshToken)) });
  if (!row || row.clientId !== input.client.id) throw new OAuthError("invalid_grant", "Unknown refresh token");
  if (row.revokedAt) throw new OAuthError("invalid_grant", "Refresh token was revoked");
  if (row.rotatedAt) {
    await db.update(oauthRefreshTokens).set({ revokedAt: new Date() }).where(eq(oauthRefreshTokens.familyId, row.familyId));
    throw new OAuthError("invalid_grant", "Refresh token was already used; all sessions for it were revoked");
  }
  if (row.expiresAt < new Date()) throw new OAuthError("invalid_grant", "Refresh token expired");
  const grant = await getActiveGrant(row.clientId, row.profileId);
  if (!grant) throw new OAuthError("invalid_grant", "Access was revoked by the user");
  // A refresh may narrow scopes, never widen them.
  const asked = input.scope?.split(/\s+/).filter(Boolean);
  if (asked?.some((s) => !row.scopes.includes(s))) throw new OAuthError("invalid_scope", "Cannot widen scopes on refresh");
  const scopes = asked?.length ? asked : row.scopes;
  await db.update(oauthRefreshTokens).set({ rotatedAt: new Date() }).where(eq(oauthRefreshTokens.tokenHash, row.tokenHash));
  return issueTokens({ client: input.client, grant, scopes: scopes.includes("offline_access") ? scopes : [...scopes, "offline_access"], familyId: row.familyId });
}

/** RFC 7009: revoking a refresh token kills its family. Unknown tokens are not an error. */
export async function revokeToken(client: OauthClient, token: string) {
  const db = getDb();
  const row = await db.query.oauthRefreshTokens.findFirst({ where: eq(oauthRefreshTokens.tokenHash, await sha256(token)) });
  if (row && row.clientId === client.id) {
    await db.update(oauthRefreshTokens).set({ revokedAt: new Date() }).where(eq(oauthRefreshTokens.familyId, row.familyId));
  }
  // Access tokens are short-lived JWTs; revoking the grant is how users cut them off (userinfo checks it).
}

/** Validates a bearer access token and returns UserInfo claims for its scopes. */
export async function userInfo(accessToken: string) {
  let payload;
  try {
    payload = await verifyJwt(accessToken, { type: "at+jwt" });
  } catch {
    throw new OAuthError("invalid_token", "Access token is invalid or expired", 401);
  }
  const grant = await getDb().query.oauthGrants.findFirst({ where: eq(oauthGrants.id, String(payload.gid)) });
  if (!grant || grant.revokedAt) throw new OAuthError("invalid_token", "Access was revoked", 401);
  const client = await getClient(grant.clientId);
  if (!client || client.status !== "ACTIVE") throw new OAuthError("invalid_token", "App is suspended", 401);
  const profile = await loadClaimProfile(grant.profileId);
  if (!profile) throw new OAuthError("invalid_token", "Account is no longer active", 401);
  const scopes = String(payload.scope ?? "").split(" ");
  return { sub: payload.sub, ...claimsFor(profile, scopes) };
}
