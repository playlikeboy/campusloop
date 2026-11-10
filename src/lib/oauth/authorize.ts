import type { OauthClient } from "@/db/schema";
import { redirectUriAllowed, resolveScopes } from "./policy";
import { getClient } from "./store";

/**
 * Validates an authorization request (shared by the consent page and its
 * server action, which re-validates instead of trusting hidden fields).
 * - "fatal": client or redirect_uri is bad. Show an error page; never redirect.
 * - "error": redirect back to the app with an OAuth error.
 * - "ok": render consent or auto-approve.
 */
export type AuthorizeCheck =
  | { kind: "fatal"; message: string }
  | { kind: "error"; redirectTo: string }
  | {
      kind: "ok";
      client: OauthClient;
      redirectUri: string;
      scopes: string[];
      state: string | null;
      nonce: string | null;
      codeChallenge: string | null;
      prompt: string | null;
    };

export function errorRedirect(redirectUri: string, error: string, description: string, state: string | null): string {
  const u = new URL(redirectUri);
  u.searchParams.set("error", error);
  u.searchParams.set("error_description", description);
  if (state) u.searchParams.set("state", state);
  u.searchParams.set("iss", "https://campusloop.space");
  return u.toString();
}

export function successRedirect(redirectUri: string, code: string, state: string | null): string {
  const u = new URL(redirectUri);
  u.searchParams.set("code", code);
  if (state) u.searchParams.set("state", state);
  u.searchParams.set("iss", "https://campusloop.space"); // RFC 9207 mix-up defence
  return u.toString();
}

export async function checkAuthorizeRequest(p: URLSearchParams): Promise<AuthorizeCheck> {
  const client = await getClient(p.get("client_id"));
  if (!client) return { kind: "fatal", message: "This app is not registered with CampusLoop." };
  if (client.status !== "ACTIVE") return { kind: "fatal", message: "This app has been suspended by CampusLoop." };
  const redirectUri = p.get("redirect_uri") ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : "");
  if (!redirectUri || !redirectUriAllowed(client.redirectUris, redirectUri)) {
    return { kind: "fatal", message: "The redirect address this app sent is not registered for it, so we stopped here to keep your account safe." };
  }
  const state = p.get("state");
  const fail = (error: string, description: string): AuthorizeCheck => ({ kind: "error", redirectTo: errorRedirect(redirectUri, error, description, state) });

  if (p.get("response_type") !== "code") return fail("unsupported_response_type", "Only response_type=code is supported");
  const codeChallenge = p.get("code_challenge");
  if (codeChallenge && (p.get("code_challenge_method") ?? "plain") !== "S256") return fail("invalid_request", "code_challenge_method must be S256");
  if (codeChallenge && !/^[A-Za-z0-9_-]{43}$/.test(codeChallenge)) return fail("invalid_request", "Malformed code_challenge");
  if (!codeChallenge && client.type === "PUBLIC") return fail("invalid_request", "PKCE (code_challenge with S256) is required for this app");

  const { granted } = resolveScopes(p.get("scope") ?? "openid", client);
  if (granted.length === 0) return fail("invalid_scope", "None of the requested scopes are available to this app");
  const nonce = p.get("nonce");
  if (nonce && nonce.length > 255) return fail("invalid_request", "nonce is too long");

  return { kind: "ok", client, redirectUri, scopes: granted, state, nonce, codeChallenge, prompt: p.get("prompt") };
}
