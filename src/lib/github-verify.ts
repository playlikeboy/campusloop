/**
 * GitHub Student Developer Pack verification
 * ------------------------------------------
 * Our own GitHub OAuth app, separate from sign-in. The student authorizes with
 * the minimal `read:user` scope, we read their GitHub id and login, ask GitHub
 * Education whether the account has student status, then revoke the token.
 * The token is never stored; only the GitHub id and login are kept, and one
 * GitHub account can verify only one CampusLoop profile.
 *
 * Student status: GitHub has no documented public API for it. The endpoint used
 * here, `GET https://education.github.com/api/user` with the user's OAuth token,
 * is what the Education site itself and several third-party integrations call;
 * it answers `{ "student": true | false, "faculty": ... }`. It is undocumented,
 * so any failure is reported as "couldn't confirm" and never as verified.
 *
 * CSRF: a random `state` plus a PKCE (S256) verifier live in a short-lived
 * httpOnly cookie bound to the profile that started the flow. The callback
 * only proceeds when the returned state matches the cookie.
 *
 * Pure helpers are exported for tests; network calls take `fetchImpl`.
 */

export const GITHUB_VERIFY_COOKIE = "cl_gh_verify";
export const GITHUB_VERIFY_SCOPE = "read:user";
export const GITHUB_VERIFY_TTL_SEC = 600;
export const GITHUB_EDUCATION_USER_URL = "https://education.github.com/api/user";

export interface GithubVerifyConfig {
  clientId: string;
  clientSecret: string;
}

export function getGithubVerifyConfig(env: Record<string, string | undefined> = process.env): GithubVerifyConfig | null {
  const clientId = env.GITHUB_VERIFY_CLIENT_ID?.trim();
  const clientSecret = env.GITHUB_VERIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

// --- encoding helpers (Web Crypto, so it runs on Workers and Node) ----------

function base64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64Url(buf);
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// --- state cookie -----------------------------------------------------------

export interface GithubVerifyState {
  state: string;
  verifier: string;
  profileId: string;
  /** Expiry, epoch ms. */
  expiresAt: number;
}

export function createVerifyState(profileId: string, now = Date.now()): GithubVerifyState {
  return {
    state: randomToken(24),
    verifier: randomToken(48),
    profileId,
    expiresAt: now + GITHUB_VERIFY_TTL_SEC * 1000,
  };
}

export function encodeVerifyState(value: GithubVerifyState): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

export function decodeVerifyState(raw: string | undefined | null): GithubVerifyState | null {
  if (!raw) return null;
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)));
    const data = JSON.parse(json) as Partial<GithubVerifyState>;
    if (
      typeof data.state !== "string" ||
      typeof data.verifier !== "string" ||
      typeof data.profileId !== "string" ||
      typeof data.expiresAt !== "number"
    ) {
      return null;
    }
    return data as GithubVerifyState;
  } catch {
    return null;
  }
}

export type StateCheck =
  | { ok: true; verifier: string }
  | { ok: false; reason: "missing" | "mismatch" | "expired" | "wrong_profile" };

/** The CSRF check the callback runs before touching the code. */
export function checkVerifyState(
  cookieRaw: string | undefined | null,
  stateParam: string | null | undefined,
  profileId: string,
  now = Date.now()
): StateCheck {
  const saved = decodeVerifyState(cookieRaw);
  if (!saved || !stateParam) return { ok: false, reason: "missing" };
  if (!constantTimeEqual(saved.state, stateParam)) return { ok: false, reason: "mismatch" };
  if (saved.expiresAt < now) return { ok: false, reason: "expired" };
  if (saved.profileId !== profileId) return { ok: false, reason: "wrong_profile" };
  return { ok: true, verifier: saved.verifier };
}

export function buildAuthorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("scope", GITHUB_VERIFY_SCOPE);
  url.searchParams.set("state", opts.state);
  url.searchParams.set("code_challenge", opts.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("allow_signup", "false");
  return url.toString();
}

// --- GitHub calls -----------------------------------------------------------

type FetchLike = typeof fetch;

const UA = "CampusLoop-Student-Verify";

export async function exchangeCodeForToken(
  config: GithubVerifyConfig,
  code: string,
  redirectUri: string,
  verifier: string,
  fetchImpl: FetchLike = fetch
): Promise<string | null> {
  const res = await fetchImpl("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { access_token?: string } | null;
  return typeof data?.access_token === "string" && data.access_token ? data.access_token : null;
}

export interface GithubIdentity {
  id: string;
  login: string;
}

export async function fetchGithubIdentity(token: string, fetchImpl: FetchLike = fetch): Promise<GithubIdentity | null> {
  const res = await fetchImpl("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": UA,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { id?: number; login?: string } | null;
  if (!data || typeof data.id !== "number" || typeof data.login !== "string") return null;
  return { id: String(data.id), login: data.login };
}

export type StudentStatus = "student" | "not_student" | "unknown";

/** Reads the Education response. Only an explicit `student: true` counts. */
export function parseEducationResponse(body: unknown): StudentStatus {
  if (!body || typeof body !== "object") return "unknown";
  const student = (body as { student?: unknown }).student;
  if (student === true) return "student";
  if (student === false) return "not_student";
  return "unknown";
}

export async function fetchStudentStatus(token: string, fetchImpl: FetchLike = fetch): Promise<StudentStatus> {
  try {
    const res = await fetchImpl(GITHUB_EDUCATION_USER_URL, {
      headers: { Accept: "application/json", Authorization: `token ${token}`, "User-Agent": UA },
    });
    if (!res.ok) return "unknown";
    return parseEducationResponse(await res.json().catch(() => null));
  } catch {
    return "unknown";
  }
}

/** Best effort: the token has done its job, so we revoke it at GitHub. */
export async function revokeGithubToken(
  config: GithubVerifyConfig,
  token: string,
  fetchImpl: FetchLike = fetch
): Promise<void> {
  try {
    await fetchImpl(`https://api.github.com/applications/${encodeURIComponent(config.clientId)}/token`, {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
        "Content-Type": "application/json",
        "User-Agent": UA,
      },
      body: JSON.stringify({ access_token: token }),
    });
  } catch {
    // Revocation failing leaves a read:user token that expires on its own; we never stored it.
  }
}

/** Outcome codes the callback puts in `/settings/verify?github=…`. */
export const GITHUB_RESULT_MESSAGES: Record<string, { tone: "success" | "error" | "info"; text: string }> = {
  verified: { tone: "success", text: "Verified with the GitHub Student Developer Pack. Your badge is live." },
  already: { tone: "info", text: "You're already verified." },
  not_student: {
    tone: "error",
    text: "GitHub says this account doesn't have student status yet. Apply for the Student Developer Pack, then try again once it's approved.",
  },
  unknown: {
    tone: "error",
    text: "We couldn't confirm your student status with GitHub right now. Try again in a few minutes, or verify with your college email.",
  },
  taken: { tone: "error", text: "That GitHub account already verified another CampusLoop profile." },
  denied: { tone: "info", text: "GitHub verification was cancelled." },
  state: { tone: "error", text: "That verification link expired or didn't match. Start again from this page." },
  not_configured: { tone: "error", text: "GitHub verification isn't set up yet." },
  error: { tone: "error", text: "Something went wrong talking to GitHub. Try again." },
};
