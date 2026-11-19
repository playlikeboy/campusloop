// OAuth 2.0 authorization code + PKCE against CampusLoop's own OAuth server.
// See docs/mobile-api.md section 1. Tokens live in SecureStore only.
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

import { OAUTH } from "./config";

const KEY_ACCESS = "cl.access_token";
const KEY_REFRESH = "cl.refresh_token";
const KEY_EXPIRES = "cl.expires_at";

export type Tokens = { accessToken: string; refreshToken: string; expiresAt: number };

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function base64url(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (i + 1 < bytes.length) out += B64[(n >> 6) & 63];
    if (i + 2 < bytes.length) out += B64[n & 63];
  }
  return out;
}

const randomString = (bytes: number) => base64url(Crypto.getRandomBytes(bytes));

async function pkceChallenge(verifier: string): Promise<string> {
  const b64 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ---- token storage -------------------------------------------------------

let cached: Tokens | null | undefined;
const listeners = new Set<(signedIn: boolean) => void>();

export function onAuthChange(fn: (signedIn: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function loadTokens(): Promise<Tokens | null> {
  if (cached !== undefined) return cached;
  const [accessToken, refreshToken, expires] = await Promise.all([
    SecureStore.getItemAsync(KEY_ACCESS),
    SecureStore.getItemAsync(KEY_REFRESH),
    SecureStore.getItemAsync(KEY_EXPIRES),
  ]);
  cached = accessToken && refreshToken ? { accessToken, refreshToken, expiresAt: Number(expires) || 0 } : null;
  return cached;
}

async function saveTokens(res: TokenResponse, previousRefresh?: string): Promise<Tokens> {
  const refreshToken = res.refresh_token || previousRefresh;
  if (!res.access_token || !refreshToken) throw new AuthError("invalid_response", "Sign-in did not return tokens");
  const tokens: Tokens = {
    accessToken: res.access_token,
    refreshToken,
    expiresAt: Date.now() + (res.expires_in ?? 3600) * 1000,
  };
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS, tokens.accessToken),
    SecureStore.setItemAsync(KEY_REFRESH, tokens.refreshToken),
    SecureStore.setItemAsync(KEY_EXPIRES, String(tokens.expiresAt)),
  ]);
  cached = tokens;
  return tokens;
}

export async function clearTokens(): Promise<void> {
  cached = null;
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ACCESS),
    SecureStore.deleteItemAsync(KEY_REFRESH),
    SecureStore.deleteItemAsync(KEY_EXPIRES),
  ]);
  listeners.forEach((fn) => fn(false));
}

async function postForm(url: string, form: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(form).toString(),
  });
  const json = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || json.error) {
    throw new AuthError(json.error || `http_${res.status}`, json.error_description || "Sign-in failed");
  }
  return json;
}

// ---- sign in -------------------------------------------------------------

export async function signIn(): Promise<boolean> {
  const verifier = randomString(32);
  const state = randomString(16);
  const challenge = await pkceChallenge(verifier);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: OAUTH.clientId,
    redirect_uri: OAUTH.redirectUri,
    scope: OAUTH.scopes,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const result = await WebBrowser.openAuthSessionAsync(`${OAUTH.authorizeUrl}?${params}`, OAUTH.redirectUri);
  if (result.type !== "success") return false;

  const query = new URL(result.url).searchParams;
  if (query.get("state") !== state) throw new AuthError("state_mismatch", "Sign-in was interrupted. Try again.");
  const error = query.get("error");
  if (error) throw new AuthError(error, query.get("error_description") || "Sign-in was cancelled");
  const code = query.get("code");
  if (!code) throw new AuthError("no_code", "Sign-in did not finish. Try again.");

  const res = await postForm(OAUTH.tokenUrl, {
    grant_type: "authorization_code",
    code,
    redirect_uri: OAUTH.redirectUri,
    client_id: OAUTH.clientId,
    code_verifier: verifier,
  });
  await saveTokens(res);
  listeners.forEach((fn) => fn(true));
  return true;
}

// ---- refresh (rotating; never run two at once) ---------------------------

let refreshing: Promise<Tokens | null> | null = null;

export function refreshTokens(): Promise<Tokens | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const current = await loadTokens();
      if (!current) return null;
      try {
        const res = await postForm(OAUTH.tokenUrl, {
          grant_type: "refresh_token",
          refresh_token: current.refreshToken,
          client_id: OAUTH.clientId,
        });
        return await saveTokens(res, current.refreshToken);
      } catch (e) {
        // A dead refresh token means the session is over. Network errors keep the tokens.
        if (e instanceof AuthError && (e.code === "invalid_grant" || e.code === "invalid_client")) {
          await clearTokens();
          return null;
        }
        throw e;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

/** A valid access token, refreshed a minute before it expires. */
export async function getAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  if (tokens.expiresAt - Date.now() > 60_000) return tokens.accessToken;
  const fresh = await refreshTokens();
  return fresh?.accessToken ?? null;
}

/** Revoke the refresh token on the server (best effort), then forget everything locally. */
export async function revokeAndClear(): Promise<void> {
  const tokens = await loadTokens();
  if (tokens) {
    await postForm(OAUTH.revokeUrl, { token: tokens.refreshToken, client_id: OAUTH.clientId }).catch(() => undefined);
  }
  await clearTokens();
}
