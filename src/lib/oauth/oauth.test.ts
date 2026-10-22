import { describe, expect, it } from "vitest";
import { nextReviewStatus, validateAppInput } from "./app-input";
import { errorRedirect, successRedirect } from "./authorize";
import { claimsFor, pairwiseSub } from "./claims";
import { discoveryDocument, SCOPES } from "./config";
import { base64url, randomToken, sha256, verifyPkce } from "./crypto";
import { jwks, signJwt, verifyJwt } from "./keys";
import { grantCovers, isValidRedirectUri, redirectUriAllowed, resolveScopes } from "./policy";

describe("redirect URIs", () => {
  it("accepts https, loopback http and native schemes only", () => {
    expect(isValidRedirectUri("https://app.example.com/callback")).toBe(true);
    expect(isValidRedirectUri("http://localhost:3000/cb")).toBe(true);
    expect(isValidRedirectUri("com.example.app:/oauth")).toBe(true);
    expect(isValidRedirectUri("http://example.com/cb")).toBe(false);
    expect(isValidRedirectUri("https://example.com/cb#frag")).toBe(false);
    expect(isValidRedirectUri("https://*.example.com/cb")).toBe(false);
    expect(isValidRedirectUri("javascript:alert(1)")).toBe(false);
    expect(isValidRedirectUri("https://user:pw@example.com/cb")).toBe(false);
  });

  it("matches exactly, except loopback ports", () => {
    const reg = ["https://app.example.com/callback", "http://localhost:3000/cb"];
    expect(redirectUriAllowed(reg, "https://app.example.com/callback")).toBe(true);
    expect(redirectUriAllowed(reg, "https://app.example.com/callback/")).toBe(false);
    expect(redirectUriAllowed(reg, "https://app.example.com/callback?x=1")).toBe(false);
    expect(redirectUriAllowed(reg, "https://app.example.com.evil.com/callback")).toBe(false);
    expect(redirectUriAllowed(reg, "http://localhost:5173/cb")).toBe(true);
    expect(redirectUriAllowed(reg, "http://localhost:5173/other")).toBe(false);
  });
});

describe("scopes", () => {
  const thirdParty = { approvedScopes: [], isFirstParty: false };
  it("drops unknown and unapproved sensitive scopes", () => {
    const r = resolveScopes("openid profile student college email bogus", thirdParty);
    expect(r.granted).toEqual(["openid", "profile", "student"]);
    expect(r.dropped).toEqual(expect.arrayContaining(["bogus", "college", "email"]));
  });
  it("grants approved and first-party sensitive scopes", () => {
    expect(resolveScopes("openid college", { approvedScopes: ["college"], isFirstParty: false }).granted).toEqual(["openid", "college"]);
    expect(resolveScopes("openid email academic", { approvedScopes: [], isFirstParty: true }).granted).toEqual(["openid", "academic", "email"]);
  });
  it("checks grant coverage", () => {
    expect(grantCovers(["openid", "profile"], ["openid"])).toBe(true);
    expect(grantCovers(["openid"], ["openid", "profile"])).toBe(false);
  });
});

describe("crypto", () => {
  it("verifies PKCE S256 (RFC 7636 appendix B vector)", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(await sha256(verifier)).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    expect(await verifyPkce(verifier, "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")).toBe(true);
    expect(await verifyPkce("short", "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")).toBe(false);
  });
  it("makes prefixed random tokens", () => {
    const t = randomToken("cl_rt_");
    expect(t.startsWith("cl_rt_")).toBe(true);
    expect(t).not.toBe(randomToken("cl_rt_"));
    expect(base64url(new Uint8Array([251, 255]))).toBe("-_8");
  });
});

describe("subjects and claims", () => {
  it("gives each app its own stable sub, shared within a sector", async () => {
    const a1 = await pairwiseSub("p1", { id: "app_a", sector: null });
    expect(await pairwiseSub("p1", { id: "app_a", sector: null })).toBe(a1);
    expect(await pairwiseSub("p1", { id: "app_b", sector: null })).not.toBe(a1);
    expect(await pairwiseSub("p1", { id: "dsaloop", sector: "campusloop" })).toBe(await pairwiseSub("p1", { id: "baby", sector: "campusloop" }));
  });
  it("releases only granted claims", () => {
    const p = { username: "asha", displayName: "Asha", avatarUrl: null, email: "a@bitmesra.ac.in", branch: "CSE", course: "B.Tech", year: 2, studentVerified: true, institution: { id: "i1", name: "BIT Mesra", slug: "bit-mesra", state: "Jharkhand" } };
    expect(claimsFor(p, ["openid", "student"])).toEqual({ student_verified: true, verification_method: "college_email" });
    const all = claimsFor(p, ["profile", "college", "academic", "email"]);
    expect(all).toMatchObject({ name: "Asha", preferred_username: "asha", college: { name: "BIT Mesra" }, branch: "CSE", degree: "B.Tech", year: 2, email: "a@bitmesra.ac.in" });
    expect(all).not.toHaveProperty("student_verified");
  });
});

describe("tokens and discovery", () => {
  it("signs and verifies ES256 JWTs against the JWKS", async () => {
    const t = await signJwt({ sub: "s1", scope: "openid" }, { audience: "app", expiresInSec: 60, type: "at+jwt" });
    const payload = await verifyJwt(t, { type: "at+jwt" });
    expect(payload).toMatchObject({ sub: "s1", aud: "app", iss: "https://campusloop.space" });
    await expect(verifyJwt(t, { type: "JWT" })).rejects.toThrow();
    const { keys } = await jwks();
    expect(keys[0]).not.toHaveProperty("d");
    expect(keys[0]).toMatchObject({ kty: "EC", alg: "ES256", use: "sig" });
  });
  it("publishes a consistent discovery document", () => {
    const d = discoveryDocument();
    expect(d.scopes_supported).toEqual(Object.keys(SCOPES));
    expect(d.code_challenge_methods_supported).toEqual(["S256"]);
    expect(d.claims_supported).toContain("student_verified");
  });
  it("builds redirects with state and issuer", () => {
    expect(successRedirect("https://a.com/cb?x=1", "c1", "s")).toBe("https://a.com/cb?x=1&code=c1&state=s&iss=https%3A%2F%2Fcampusloop.space");
    expect(errorRedirect("https://a.com/cb", "access_denied", "no", null)).toContain("error=access_denied");
  });
});

describe("app registration input", () => {
  const base = { name: "Hack Fest", redirectUris: "https://fest.example.com/cb\nhttp://localhost:3000/cb", type: "CONFIDENTIAL" };
  it("normalises valid input", () => {
    const r = validateAppInput(base);
    expect(r.ok && r.value.redirectUris).toEqual(["https://fest.example.com/cb", "http://localhost:3000/cb"]);
  });
  it("rejects bad redirect URIs, impersonation and missing privacy policy", () => {
    expect(validateAppInput({ ...base, redirectUris: "http://fest.example.com/cb" }).ok).toBe(false);
    expect(validateAppInput({ ...base, name: "CampusLoop Pro" }).ok).toBe(false);
    expect(validateAppInput({ ...base, sensitiveScopes: ["college"] }).ok).toBe(false);
    expect(validateAppInput({ ...base, sensitiveScopes: ["college", "admin"], privacyUrl: "https://fest.example.com/privacy" })).toMatchObject({ ok: true, value: { sensitiveScopes: ["college"] } });
  });
  it("puts new sensitive scopes into review", () => {
    expect(nextReviewStatus(["college"], [], "NONE")).toBe("PENDING");
    expect(nextReviewStatus(["college"], ["college"], "PENDING")).toBe("APPROVED");
    expect(nextReviewStatus([], [], "NONE")).toBe("NONE");
  });
});
