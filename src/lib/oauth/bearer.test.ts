import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory rows for the three lookups bearer verification makes.
const fixtures: Record<string, Record<string, unknown> | null> = {};
vi.mock("@/db", () => ({
  getDb: () => ({
    query: new Proxy(
      {},
      { get: (_t, table: string) => ({ findFirst: async () => fixtures[table] ?? null }) }
    ),
  }),
}));

const cookieJar = new Map<string, string>();
const headerMap = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    getAll: () => Array.from(cookieJar, ([name, value]) => ({ name, value })),
  })),
  headers: vi.fn(async () => ({ get: (name: string) => headerMap.get(name.toLowerCase()) ?? null })),
}));
vi.mock("react", async (orig) => ({
  ...(await orig<typeof import("react")>()),
  cache: <T,>(fn: T) => fn,
}));

import { hexclaveServerApp } from "@/hexclave/server";
import { __clearServerCachesForTests, getCachedAuthUser, getCachedSessionUser } from "@/lib/server-cache";
import { checkAuthorizeRequest } from "./authorize";
import { __clearBearerCacheForTests, readBearerToken, verifyAppBearer } from "./bearer";
import { MOBILE_CLIENT_ID, MOBILE_REDIRECT_URI, discoveryDocument } from "./config";
import { signJwt } from "./keys";
import { redirectUriAllowed, resolveScopes } from "./policy";
import { assertScopesAllowed } from "./store";

const getUser = hexclaveServerApp.getUser as unknown as ReturnType<typeof vi.fn>;

const mobileClient = {
  id: MOBILE_CLIENT_ID,
  status: "ACTIVE",
  type: "PUBLIC",
  redirectUris: [MOBILE_REDIRECT_URI],
  approvedScopes: [],
  isFirstParty: true,
  sector: "campusloop",
};
const thirdPartyClient = {
  id: "cl_app_thirdparty",
  status: "ACTIVE",
  type: "CONFIDENTIAL",
  redirectUris: ["https://third.example.com/cb"],
  approvedScopes: [],
  // Even an admin-marked "CampusLoop app" must not get `app`: it is keyed on client id.
  isFirstParty: true,
  sector: "campusloop",
};
const grant = { id: "grant_1", clientId: MOBILE_CLIENT_ID, profileId: "prof_1", scopes: ["openid", "app"], revokedAt: null };
const profile = {
  id: "prof_1",
  userId: "hex_user_1",
  email: "a@college.edu",
  displayName: "Asha",
  avatarUrl: null,
  status: "ACTIVE",
};

function token(opts: { clientId?: string; scope?: string; gid?: string; expiresInSec?: number } = {}) {
  const clientId = opts.clientId ?? MOBILE_CLIENT_ID;
  return signJwt(
    { sub: "pairwise", client_id: clientId, scope: opts.scope ?? "openid profile offline_access app", gid: opts.gid ?? grant.id },
    { audience: clientId, expiresInSec: opts.expiresInSec ?? 3600, type: "at+jwt" }
  );
}

beforeEach(() => {
  fixtures.oauthGrants = { ...grant };
  fixtures.oauthClients = { ...mobileClient };
  fixtures.userProfiles = { ...profile };
  cookieJar.clear();
  headerMap.clear();
  getUser.mockReset();
  getUser.mockResolvedValue(null);
  __clearBearerCacheForTests();
  __clearServerCachesForTests();
});

describe("verifyAppBearer", () => {
  it("accepts a valid campusloop-android token with the app scope", async () => {
    const r = await verifyAppBearer(await token());
    expect(r).toEqual({
      ok: true,
      profileId: "prof_1",
      user: { id: "hex_user_1", primaryEmail: "a@college.edu", primaryEmailVerified: false, displayName: "Asha", profileImageUrl: null },
    });
  });

  it("rejects a token issued to another client, even with the app scope", async () => {
    fixtures.oauthGrants = { ...grant, clientId: thirdPartyClient.id };
    fixtures.oauthClients = { ...thirdPartyClient };
    expect(await verifyAppBearer(await token({ clientId: thirdPartyClient.id }))).toEqual({ ok: false, reason: "wrong_client" });
  });

  it("rejects an expired token", async () => {
    expect(await verifyAppBearer(await token({ expiresInSec: -60 }))).toEqual({ ok: false, reason: "invalid_token" });
  });

  it("rejects a tampered token", async () => {
    const t = await token();
    expect(await verifyAppBearer(`${t.slice(0, -4)}AAAA`)).toEqual({ ok: false, reason: "invalid_token" });
  });

  it("rejects a revoked grant", async () => {
    fixtures.oauthGrants = { ...grant, revokedAt: new Date() };
    expect(await verifyAppBearer(await token())).toEqual({ ok: false, reason: "revoked" });
  });

  it("rejects a missing grant", async () => {
    fixtures.oauthGrants = null;
    expect(await verifyAppBearer(await token())).toEqual({ ok: false, reason: "revoked" });
  });

  it("rejects a token without the app scope", async () => {
    expect(await verifyAppBearer(await token({ scope: "openid profile offline_access" }))).toEqual({ ok: false, reason: "missing_scope" });
  });

  it("rejects suspended clients and inactive accounts", async () => {
    fixtures.oauthClients = { ...mobileClient, status: "SUSPENDED" };
    expect(await verifyAppBearer(await token())).toEqual({ ok: false, reason: "client_inactive" });
    fixtures.oauthClients = { ...mobileClient };
    fixtures.userProfiles = { ...profile, status: "BANNED" };
    expect(await verifyAppBearer(await token())).toEqual({ ok: false, reason: "account_inactive" });
  });

  it("caches a verified token for 30s by hash", async () => {
    const t = await token();
    expect((await verifyAppBearer(t)).ok).toBe(true);
    fixtures.oauthGrants = { ...grant, revokedAt: new Date() };
    expect((await verifyAppBearer(t)).ok).toBe(true); // cache hit
    __clearBearerCacheForTests();
    expect((await verifyAppBearer(t)).ok).toBe(false);
  });
});

describe("readBearerToken", () => {
  it("only takes a compact JWS from a Bearer header", () => {
    expect(readBearerToken("Bearer a.b.c")).toBe("a.b.c");
    expect(readBearerToken("bearer a.b.c")).toBe("a.b.c");
    expect(readBearerToken("Basic abc")).toBeNull();
    expect(readBearerToken("Bearer cl_rt_opaque")).toBeNull();
    expect(readBearerToken(null)).toBeNull();
  });
});

describe("getCachedAuthUser with a bearer token", () => {
  it("returns the same shape as the cookie path when no cookie is present", async () => {
    headerMap.set("authorization", `Bearer ${await token()}`);
    const user = await getCachedAuthUser();
    expect(user?.id).toBe("hex_user_1");
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns null for a third-party token", async () => {
    fixtures.oauthGrants = { ...grant, clientId: thirdPartyClient.id };
    headerMap.set("authorization", `Bearer ${await token({ clientId: thirdPartyClient.id })}`);
    expect(await getCachedAuthUser()).toBeNull();
  });

  it("prefers the cookie session over the header", async () => {
    cookieJar.set("hexclave-access", "cookie-token");
    headerMap.set("authorization", `Bearer ${await token()}`);
    getUser.mockResolvedValue({ id: "cookie_user", primaryEmail: null, primaryEmailVerified: true, displayName: null, profileImageUrl: null });
    expect((await getCachedAuthUser())?.id).toBe("cookie_user");
  });

  it("never lets a bearer token drive the consent page (cookie-only helper)", async () => {
    headerMap.set("authorization", `Bearer ${await token()}`);
    expect(await getCachedSessionUser()).toBeNull();
  });
});

describe("app scope is first-party only", () => {
  it("is dropped for third-party clients and kept for campusloop-android", () => {
    expect(resolveScopes("openid app", thirdPartyClient).granted).toEqual(["openid"]);
    expect(resolveScopes("openid app", { approvedScopes: [], isFirstParty: true }).granted).toEqual(["openid"]);
    expect(resolveScopes("openid offline_access app", mobileClient).granted).toEqual(["openid", "offline_access", "app"]);
  });

  it("is not advertised in discovery", () => {
    expect(discoveryDocument().scopes_supported).not.toContain("app");
  });

  it("is refused at /oauth/authorize for a third-party client", async () => {
    fixtures.oauthClients = { ...thirdPartyClient };
    const p = new URLSearchParams({
      client_id: thirdPartyClient.id,
      redirect_uri: "https://third.example.com/cb",
      response_type: "code",
      scope: "app",
    });
    const check = await checkAuthorizeRequest(p);
    expect(check.kind).toBe("error");
    if (check.kind === "error") expect(new URL(check.redirectTo).searchParams.get("error")).toBe("invalid_scope");

    p.set("scope", "openid app");
    const mixed = await checkAuthorizeRequest(p);
    expect(mixed.kind === "ok" && mixed.scopes).toEqual(["openid"]);
  });

  it("is refused at the token step for a third-party client", () => {
    expect(() => assertScopesAllowed(thirdPartyClient, ["openid", "app"])).toThrow(/Scope not available/);
    expect(() => assertScopesAllowed(mobileClient, ["openid", "app"])).not.toThrow();
  });

  it("lets campusloop-android authorize with PKCE on its custom scheme", async () => {
    const p = new URLSearchParams({
      client_id: MOBILE_CLIENT_ID,
      redirect_uri: MOBILE_REDIRECT_URI,
      response_type: "code",
      scope: "openid profile offline_access app",
      code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
      code_challenge_method: "S256",
    });
    const ok = await checkAuthorizeRequest(p);
    expect(ok.kind).toBe("ok");
    p.delete("code_challenge");
    const noPkce = await checkAuthorizeRequest(p);
    expect(noPkce.kind).toBe("error");
  });

  it("allows campusloop://oauth only for the mobile client", () => {
    expect(redirectUriAllowed([MOBILE_REDIRECT_URI], MOBILE_REDIRECT_URI, MOBILE_CLIENT_ID)).toBe(true);
    expect(redirectUriAllowed([MOBILE_REDIRECT_URI], MOBILE_REDIRECT_URI, "cl_app_other")).toBe(false);
    expect(redirectUriAllowed([MOBILE_REDIRECT_URI], MOBILE_REDIRECT_URI)).toBe(false);
  });
});
