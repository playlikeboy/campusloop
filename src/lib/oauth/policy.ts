import { SCOPES, SUPPORTED_SCOPES } from "./config";

/** Pure OAuth policy: redirect URIs and scopes. No DB, unit-tested. */

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Allowed redirect URIs: https, http on loopback (local development), or a
 * reverse-DNS private-use scheme for native apps (com.example.app:/callback).
 * No fragments, no wildcards, no credentials.
 */
export function isValidRedirectUri(uri: string): boolean {
  if (!uri || uri.length > 2000 || uri.includes("*")) return false;
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return false;
  }
  if (u.hash || u.username || u.password) return false;
  if (u.protocol === "https:") return Boolean(u.hostname);
  if (u.protocol === "http:") return LOOPBACK.has(u.hostname);
  return /^[a-z][a-z0-9+.-]*\.[a-z0-9+.-]+:$/i.test(u.protocol); // private-use scheme with a dot
}

/**
 * Exact match against a registered URI. Loopback URIs may use any port
 * (RFC 8252 section 7.3) because native and dev servers pick ports at runtime.
 */
export function redirectUriAllowed(registered: string[], given: string): boolean {
  if (!isValidRedirectUri(given)) return false;
  if (registered.includes(given)) return true;
  const g = new URL(given);
  if (g.protocol !== "http:" || !LOOPBACK.has(g.hostname)) return false;
  return registered.some((r) => {
    try {
      const u = new URL(r);
      return u.protocol === "http:" && LOOPBACK.has(u.hostname) && u.hostname === g.hostname && u.pathname === g.pathname && u.search === g.search;
    } catch {
      return false;
    }
  });
}

export interface ScopePolicyClient {
  approvedScopes: string[];
  isFirstParty: boolean;
}

/**
 * Parses a space-separated scope string and keeps only what this client may
 * get: unknown scopes are ignored, sensitive ones need admin approval (or a
 * first-party app). Order follows SUPPORTED_SCOPES for stable output.
 */
export function resolveScopes(requested: string | null | undefined, client: ScopePolicyClient): { granted: string[]; dropped: string[] } {
  const asked = new Set((requested ?? "").split(/\s+/).filter(Boolean));
  const granted: string[] = [];
  const dropped: string[] = [];
  for (const s of asked) if (!SCOPES[s]) dropped.push(s);
  for (const s of SUPPORTED_SCOPES) {
    if (!asked.has(s)) continue;
    if (SCOPES[s].needsReview && !client.isFirstParty && !client.approvedScopes.includes(s)) dropped.push(s);
    else granted.push(s);
  }
  return { granted, dropped };
}

/** True when an existing grant already covers every scope asked for now. */
export function grantCovers(grantScopes: string[], wanted: string[]): boolean {
  return wanted.every((s) => grantScopes.includes(s));
}
