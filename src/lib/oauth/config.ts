/** Login with CampusLoop: OpenID Connect provider settings (client-safe, no secrets). */

export const ISSUER = "https://campusloop.space";

export const TTL = {
  codeSec: 60,
  accessTokenSec: 60 * 60,
  idTokenSec: 60 * 60,
  refreshTokenSec: 30 * 24 * 60 * 60,
} as const;

export interface ScopeInfo {
  /** Shown on the consent screen: "<App> wants to ..." */
  consent: string;
  claims: string[];
  /**
   * Scopes needing admin approval per app. Currently none: every scope is
   * available to every app, and the student still approves on the consent
   * screen. Private data (phone, date of birth, gender, location, dating or
   * anonymous identity) is never exposed through any scope.
   */
  needsReview: boolean;
  /**
   * Only CampusLoop's own apps (FULL_SESSION_CLIENTS) can get this scope. It is
   * never shown in discovery, never requestable by developer-portal apps, and
   * dropped from any other client's authorization request.
   */
  firstPartyOnly?: boolean;
}

/**
 * The official CampusLoop Android app: a PUBLIC client (no secret, PKCE
 * required). Register it with scripts/oauth/register-mobile-client.ts.
 */
export const MOBILE_CLIENT_ID = "campusloop-android";
export const MOBILE_REDIRECT_URI = "campusloop://oauth";

/**
 * `app`: the access token acts as the student's full CampusLoop session on
 * /api/* (see src/lib/oauth/bearer.ts). First-party only.
 */
export const APP_SCOPE = "app";

/** Clients allowed to receive APP_SCOPE. Keyed on client id, not the admin "first-party" flag. */
export const FULL_SESSION_CLIENTS: ReadonlySet<string> = new Set([MOBILE_CLIENT_ID]);

export const SCOPES: Record<string, ScopeInfo> = {
  openid: { consent: "Sign you in with your CampusLoop account", claims: ["sub"], needsReview: false },
  profile: { consent: "See your name, username and profile photo", claims: ["name", "preferred_username", "picture", "profile"], needsReview: false },
  student: { consent: "Confirm whether you're a verified college student", claims: ["student_verified", "verification_method"], needsReview: false },
  college: { consent: "See which college you study at", claims: ["college"], needsReview: false },
  academic: { consent: "See your branch, degree and year", claims: ["branch", "degree", "year"], needsReview: false },
  email: { consent: "See your email address", claims: ["email"], needsReview: false },
  offline_access: { consent: "Stay signed in when you're not using it", claims: [], needsReview: false },
  [APP_SCOPE]: { consent: "Use CampusLoop as you in the official app", claims: [], needsReview: false, firstPartyOnly: true },
};

/** Every scope the server knows, including first-party-only ones. */
export const ALL_SCOPES = Object.keys(SCOPES);
/** Scopes any registered app may request (discovery, developer portal). Excludes first-party-only scopes. */
export const SUPPORTED_SCOPES = ALL_SCOPES.filter((s) => !SCOPES[s].firstPartyOnly);
export const SENSITIVE_SCOPES = SUPPORTED_SCOPES.filter((s) => SCOPES[s].needsReview);

export const ENDPOINTS = {
  authorization: `${ISSUER}/oauth/authorize`,
  token: `${ISSUER}/oauth/token`,
  userinfo: `${ISSUER}/oauth/userinfo`,
  jwks: `${ISSUER}/oauth/jwks.json`,
  revocation: `${ISSUER}/oauth/revoke`,
} as const;

export function discoveryDocument() {
  return {
    issuer: ISSUER,
    authorization_endpoint: ENDPOINTS.authorization,
    token_endpoint: ENDPOINTS.token,
    userinfo_endpoint: ENDPOINTS.userinfo,
    jwks_uri: ENDPOINTS.jwks,
    revocation_endpoint: ENDPOINTS.revocation,
    service_documentation: `${ISSUER}/developers`,
    scopes_supported: SUPPORTED_SCOPES,
    claims_supported: ["iss", "aud", "exp", "iat", "auth_time", "nonce", ...new Set(SUPPORTED_SCOPES.flatMap((s) => SCOPES[s].claims))],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["pairwise"],
    id_token_signing_alg_values_supported: ["ES256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    revocation_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    code_challenge_methods_supported: ["S256"],
    prompt_values_supported: ["none", "consent", "login"],
    ui_locales_supported: ["en-IN"],
  };
}
