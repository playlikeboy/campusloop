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
  /** Sensitive scopes work only after an admin approves them for the app. */
  needsReview: boolean;
}

export const SCOPES: Record<string, ScopeInfo> = {
  openid: { consent: "Sign you in with your CampusLoop account", claims: ["sub"], needsReview: false },
  profile: { consent: "See your name, username and profile photo", claims: ["name", "preferred_username", "picture", "profile"], needsReview: false },
  student: { consent: "Confirm whether you're a verified college student", claims: ["student_verified", "verification_method"], needsReview: false },
  college: { consent: "See which college you study at", claims: ["college"], needsReview: true },
  academic: { consent: "See your branch, degree and year", claims: ["branch", "degree", "year"], needsReview: true },
  email: { consent: "See your email address", claims: ["email"], needsReview: true },
  offline_access: { consent: "Stay signed in when you're not using it", claims: [], needsReview: false },
};

export const SUPPORTED_SCOPES = Object.keys(SCOPES);
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
