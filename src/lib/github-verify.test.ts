import { describe, expect, it, vi } from "vitest";
import {
  buildAuthorizeUrl,
  checkVerifyState,
  createVerifyState,
  decodeVerifyState,
  encodeVerifyState,
  fetchStudentStatus,
  getGithubVerifyConfig,
  parseEducationResponse,
  pkceChallenge,
} from "./github-verify";

describe("GitHub verify state (CSRF)", () => {
  const now = 1_700_000_000_000;

  it("accepts the state it issued, for the same profile, before expiry", () => {
    const s = createVerifyState("p1", now);
    const res = checkVerifyState(encodeVerifyState(s), s.state, "p1", now + 1000);
    expect(res).toEqual({ ok: true, verifier: s.verifier });
  });

  it("rejects a missing cookie or missing state", () => {
    const s = createVerifyState("p1", now);
    expect(checkVerifyState(undefined, s.state, "p1", now)).toEqual({ ok: false, reason: "missing" });
    expect(checkVerifyState(encodeVerifyState(s), null, "p1", now)).toEqual({ ok: false, reason: "missing" });
    expect(checkVerifyState("garbage!!", s.state, "p1", now)).toEqual({ ok: false, reason: "missing" });
  });

  it("rejects a forged or mismatched state", () => {
    const s = createVerifyState("p1", now);
    expect(checkVerifyState(encodeVerifyState(s), `${s.state}x`, "p1", now)).toEqual({ ok: false, reason: "mismatch" });
    expect(checkVerifyState(encodeVerifyState(s), "short", "p1", now)).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects an expired state and a state started by another profile", () => {
    const s = createVerifyState("p1", now);
    expect(checkVerifyState(encodeVerifyState(s), s.state, "p1", now + 11 * 60_000)).toEqual({
      ok: false,
      reason: "expired",
    });
    expect(checkVerifyState(encodeVerifyState(s), s.state, "p2", now)).toEqual({ ok: false, reason: "wrong_profile" });
  });

  it("issues a fresh random state every time and round-trips the cookie", () => {
    const a = createVerifyState("p1", now);
    const b = createVerifyState("p1", now);
    expect(a.state).not.toBe(b.state);
    expect(a.verifier.length).toBeGreaterThanOrEqual(43);
    expect(decodeVerifyState(encodeVerifyState(a))).toEqual(a);
  });
});

describe("GitHub authorize URL", () => {
  it("asks only for read:user and carries state and an S256 challenge", async () => {
    const challenge = await pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");
    // RFC 7636 appendix B test vector.
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    const url = new URL(
      buildAuthorizeUrl({ clientId: "cid", redirectUri: "https://x.test/cb", state: "st", codeChallenge: challenge })
    );
    expect(url.origin + url.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(url.searchParams.get("scope")).toBe("read:user");
    expect(url.searchParams.get("state")).toBe("st");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("is unconfigured without both env vars", () => {
    expect(getGithubVerifyConfig({})).toBeNull();
    expect(getGithubVerifyConfig({ GITHUB_VERIFY_CLIENT_ID: "a" })).toBeNull();
    expect(getGithubVerifyConfig({ GITHUB_VERIFY_CLIENT_ID: "a", GITHUB_VERIFY_CLIENT_SECRET: "b" })).toEqual({
      clientId: "a",
      clientSecret: "b",
    });
  });
});

describe("student status", () => {
  it("counts only an explicit student: true", () => {
    expect(parseEducationResponse({ student: true })).toBe("student");
    expect(parseEducationResponse({ student: false, faculty: true })).toBe("not_student");
    expect(parseEducationResponse({ student: "true" })).toBe("unknown");
    expect(parseEducationResponse(null)).toBe("unknown");
  });

  it("reports unknown when GitHub Education errors or is unreachable", async () => {
    const failing = vi.fn(async () => new Response("nope", { status: 401 }));
    expect(await fetchStudentStatus("t", failing as unknown as typeof fetch)).toBe("unknown");
    const throwing = vi.fn(async () => {
      throw new Error("offline");
    });
    expect(await fetchStudentStatus("t", throwing as unknown as typeof fetch)).toBe("unknown");
    const ok = vi.fn(async () => Response.json({ student: true }));
    expect(await fetchStudentStatus("t", ok as unknown as typeof fetch)).toBe("student");
  });
});
