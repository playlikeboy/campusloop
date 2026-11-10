import { ENDPOINTS, ISSUER } from "./config";

/**
 * The Login with CampusLoop skill for AI coding agents. One source for:
 * - the public file at /developers/SKILL.md (placeholders, no secrets),
 * - the "Copy prompt" buttons in the developer portal (with the app's keys),
 * - the docs at /developers.
 * Client-safe: no DB, no secrets unless passed in.
 */

export const SKILL_URL = `${ISSUER}/developers/SKILL.md`;
export const DEFAULT_SCOPE = "openid profile email student college academic";

export interface SkillKeys {
  appName?: string;
  clientId?: string;
  clientSecret?: string | null;
  redirectUris?: string[];
  /** Browser or mobile app: PKCE only, no secret. */
  publicClient?: boolean;
}

function env(k: SkillKeys) {
  return [
    `CAMPUSLOOP_ISSUER=${ISSUER}`,
    `CAMPUSLOOP_CLIENT_ID=${k.clientId ?? "cl_app_YOUR_CLIENT_ID"}`,
    ...(k.publicClient ? [] : [`CAMPUSLOOP_CLIENT_SECRET=${k.clientSecret ?? "YOUR_CLIENT_SECRET"}`]),
  ].join("\n");
}

export interface Recipe {
  id: string;
  title: string;
  callback: string;
  install?: string;
  code: string;
}

/** Framework recipes. `callback` is the redirect URI path the library uses. */
export const RECIPES: Recipe[] = [
  {
    id: "better-auth",
    title: "Better Auth",
    callback: "/api/auth/oauth2/callback/campusloop",
    install: "npm i better-auth",
    code: `// lib/auth.ts
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

export const auth = betterAuth({
  // ...your database and other options
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "campusloop",
          clientId: process.env.CAMPUSLOOP_CLIENT_ID!,
          clientSecret: process.env.CAMPUSLOOP_CLIENT_SECRET!,
          discoveryUrl: "${ISSUER}/.well-known/openid-configuration",
          scopes: ["openid", "profile", "email", "student", "college", "academic"],
          pkce: true,
        },
      ],
    }),
  ],
});

// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";
export const authClient = createAuthClient({ plugins: [genericOAuthClient()] });

// Button onClick:
await authClient.signIn.oauth2({ providerId: "campusloop", callbackURL: "/dashboard" });`,
  },
  {
    id: "authjs",
    title: "Auth.js / NextAuth v5 (Next.js, SvelteKit, Express)",
    callback: "/api/auth/callback/campusloop",
    install: "npm i next-auth@beta",
    code: `// auth.ts
import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: "campusloop",
      name: "CampusLoop",
      type: "oidc",
      issuer: "${ISSUER}",
      clientId: process.env.CAMPUSLOOP_CLIENT_ID,
      clientSecret: process.env.CAMPUSLOOP_CLIENT_SECRET,
      authorization: { params: { scope: "${DEFAULT_SCOPE}" } },
      checks: ["pkce", "state", "nonce"],
    },
  ],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.studentVerified = profile.student_verified === true;
        token.college = (profile as { college?: { name: string } }).college?.name ?? null;
      }
      return token;
    },
    session({ session, token }) {
      return { ...session, user: { ...session.user, studentVerified: token.studentVerified, college: token.college } };
    },
  },
});

// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;

// Button (server action):
// <form action={async () => { "use server"; await signIn("campusloop"); }}><button>Continue with CampusLoop</button></form>`,
  },
  {
    id: "nextauth-v4",
    title: "NextAuth v4",
    callback: "/api/auth/callback/campusloop",
    code: `// pages/api/auth/[...nextauth].ts (or app/api/auth/[...nextauth]/route.ts)
import NextAuth from "next-auth";

export default NextAuth({
  providers: [
    {
      id: "campusloop",
      name: "CampusLoop",
      type: "oauth",
      wellKnown: "${ISSUER}/.well-known/openid-configuration",
      authorization: { params: { scope: "${DEFAULT_SCOPE}" } },
      idToken: true,
      checks: ["pkce", "state"],
      clientId: process.env.CAMPUSLOOP_CLIENT_ID,
      clientSecret: process.env.CAMPUSLOOP_CLIENT_SECRET,
      profile(p) {
        return { id: p.sub, name: p.name, email: p.email, image: p.picture, studentVerified: p.student_verified };
      },
    },
  ],
});`,
  },
  {
    id: "js-sdk",
    title: "Any website, no build step (JS SDK)",
    callback: "/callback.html",
    code: `<!-- Public client: register the app as "Browser or mobile app" (no secret). -->
<div id="campusloop-login"></div>
<script src="${ISSUER}/sdk/v1/campusloop.js"></script>
<script>
  CampusLoop.init({ clientId: "CAMPUSLOOP_CLIENT_ID", redirectUri: location.origin + "/callback.html", scope: "${DEFAULT_SCOPE}" });
  CampusLoop.renderButton(document.getElementById("campusloop-login"), { theme: "light" });
</script>

<!-- callback.html -->
<script src="${ISSUER}/sdk/v1/campusloop.js"></script>
<script>
  CampusLoop.init({ clientId: "CAMPUSLOOP_CLIENT_ID", redirectUri: location.origin + "/callback.html" });
  CampusLoop.handleRedirect().then(({ user, idToken }) => {
    // POST idToken to your backend and verify it with the JWKS before trusting it.
  });
</script>`,
  },
  {
    id: "express",
    title: "Node / Express (openid-client v6)",
    callback: "/auth/campusloop/callback",
    install: "npm i openid-client express-session",
    code: `import express from "express";
import session from "express-session";
import * as client from "openid-client";

const app = express();
app.use(session({ secret: process.env.SESSION_SECRET!, resave: false, saveUninitialized: false }));
const config = await client.discovery(new URL("${ISSUER}"), process.env.CAMPUSLOOP_CLIENT_ID!, process.env.CAMPUSLOOP_CLIENT_SECRET!);
const redirect_uri = process.env.APP_URL + "/auth/campusloop/callback";

app.get("/auth/campusloop", async (req, res) => {
  const verifier = client.randomPKCECodeVerifier();
  const state = client.randomState();
  Object.assign(req.session, { verifier, state });
  const url = client.buildAuthorizationUrl(config, {
    redirect_uri, scope: "${DEFAULT_SCOPE}", state,
    code_challenge: await client.calculatePKCECodeChallenge(verifier), code_challenge_method: "S256",
  });
  res.redirect(url.href);
});

app.get("/auth/campusloop/callback", async (req, res) => {
  const { verifier, state } = req.session as any;
  const tokens = await client.authorizationCodeGrant(config, new URL(req.originalUrl, process.env.APP_URL), {
    pkceCodeVerifier: verifier, expectedState: state,
  });
  const claims = tokens.claims()!; // { sub, name, email, student_verified, college, ... }
  (req.session as any).user = claims;
  res.redirect("/");
});`,
  },
  {
    id: "django",
    title: "Django (mozilla-django-oidc)",
    callback: "/oidc/callback/",
    install: "pip install mozilla-django-oidc",
    code: `# settings.py
INSTALLED_APPS += ["mozilla_django_oidc"]
AUTHENTICATION_BACKENDS = ["mozilla_django_oidc.auth.OIDCAuthenticationBackend", "django.contrib.auth.backends.ModelBackend"]
OIDC_RP_CLIENT_ID = os.environ["CAMPUSLOOP_CLIENT_ID"]
OIDC_RP_CLIENT_SECRET = os.environ["CAMPUSLOOP_CLIENT_SECRET"]
OIDC_RP_SIGN_ALGO = "ES256"
OIDC_RP_SCOPES = "${DEFAULT_SCOPE}"
OIDC_USE_PKCE = True
OIDC_OP_AUTHORIZATION_ENDPOINT = "${ENDPOINTS.authorization}"
OIDC_OP_TOKEN_ENDPOINT = "${ENDPOINTS.token}"
OIDC_OP_USER_ENDPOINT = "${ENDPOINTS.userinfo}"
OIDC_OP_JWKS_ENDPOINT = "${ENDPOINTS.jwks}"
LOGIN_REDIRECT_URL = "/"

# urls.py
path("oidc/", include("mozilla_django_oidc.urls")),
# Login link: {% url 'oidc_authentication_init' %}`,
  },
  {
    id: "authlib",
    title: "Python Flask / FastAPI (Authlib)",
    callback: "/auth/campusloop/callback",
    install: "pip install authlib requests",
    code: `from authlib.integrations.flask_client import OAuth

oauth = OAuth(app)
oauth.register(
    name="campusloop",
    client_id=os.environ["CAMPUSLOOP_CLIENT_ID"],
    client_secret=os.environ["CAMPUSLOOP_CLIENT_SECRET"],
    server_metadata_url="${ISSUER}/.well-known/openid-configuration",
    client_kwargs={"scope": "${DEFAULT_SCOPE}", "code_challenge_method": "S256"},
)

@app.route("/auth/campusloop")
def login():
    return oauth.campusloop.authorize_redirect(url_for("callback", _external=True))

@app.route("/auth/campusloop/callback")
def callback():
    token = oauth.campusloop.authorize_access_token()
    user = token["userinfo"]  # sub, name, email, student_verified, college ...
    session["user"] = dict(user)
    return redirect("/")
# FastAPI: use authlib.integrations.starlette_client.OAuth with the same register() call.`,
  },
  {
    id: "spring",
    title: "Java Spring Boot (Spring Security)",
    callback: "/login/oauth2/code/campusloop",
    code: `# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          campusloop:
            client-id: \${CAMPUSLOOP_CLIENT_ID}
            client-secret: \${CAMPUSLOOP_CLIENT_SECRET}
            scope: [openid, profile, email, student, college, academic]
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
        provider:
          campusloop:
            issuer-uri: ${ISSUER}

// CampusLoop signs id_tokens with ES256 (Spring defaults to RS256):
@Bean
JwtDecoderFactory<ClientRegistration> idTokenDecoderFactory() {
  OidcIdTokenDecoderFactory f = new OidcIdTokenDecoderFactory();
  f.setJwsAlgorithmResolver(r -> SignatureAlgorithm.ES256);
  return f;
}`,
  },
  {
    id: "rails",
    title: "Ruby on Rails (omniauth_openid_connect)",
    callback: "/auth/campusloop/callback",
    install: "bundle add omniauth_openid_connect omniauth-rails_csrf_protection",
    code: `# config/initializers/omniauth.rb
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :openid_connect,
    name: :campusloop,
    issuer: "${ISSUER}",
    discovery: true,
    scope: %i[openid profile email student college academic],
    response_type: :code,
    pkce: true,
    client_options: {
      identifier: ENV["CAMPUSLOOP_CLIENT_ID"],
      secret: ENV["CAMPUSLOOP_CLIENT_SECRET"],
      redirect_uri: "#{ENV['APP_URL']}/auth/campusloop/callback",
    }
end
# Login: button_to "Continue with CampusLoop", "/auth/campusloop", method: :post
# Callback: request.env["omniauth.auth"]["extra"]["raw_info"]["student_verified"]`,
  },
  {
    id: "laravel",
    title: "PHP / Laravel (league/oauth2-client)",
    callback: "/auth/campusloop/callback",
    install: "composer require league/oauth2-client",
    code: `$provider = new \\League\\OAuth2\\Client\\Provider\\GenericProvider([
    'clientId'                => env('CAMPUSLOOP_CLIENT_ID'),
    'clientSecret'            => env('CAMPUSLOOP_CLIENT_SECRET'),
    'redirectUri'             => url('/auth/campusloop/callback'),
    'urlAuthorize'            => '${ENDPOINTS.authorization}',
    'urlAccessToken'          => '${ENDPOINTS.token}',
    'urlResourceOwnerDetails' => '${ENDPOINTS.userinfo}',
    'scopes'                  => '${DEFAULT_SCOPE}',
    'scopeSeparator'          => ' ',
    'pkceMethod'              => \\League\\OAuth2\\Client\\Provider\\GenericProvider::PKCE_METHOD_S256,
]);
// Login: redirect($provider->getAuthorizationUrl()); store $provider->getState() and $provider->getPkceCode() in the session.
// Callback: $provider->setPkceCode(session('pkce'));
//   $token = $provider->getAccessToken('authorization_code', ['code' => request('code')]);
//   $user = $provider->getResourceOwner($token)->toArray(); // sub, name, email, student_verified ...`,
  },
  {
    id: "go",
    title: "Go (coreos/go-oidc + x/oauth2)",
    callback: "/auth/campusloop/callback",
    code: `provider, _ := oidc.NewProvider(ctx, "${ISSUER}")
conf := oauth2.Config{
	ClientID:     os.Getenv("CAMPUSLOOP_CLIENT_ID"),
	ClientSecret: os.Getenv("CAMPUSLOOP_CLIENT_SECRET"),
	RedirectURL:  os.Getenv("APP_URL") + "/auth/campusloop/callback",
	Endpoint:     provider.Endpoint(),
	Scopes:       []string{oidc.ScopeOpenID, "profile", "email", "student", "college", "academic"},
}
verifier := provider.Verifier(&oidc.Config{ClientID: conf.ClientID, SupportedSigningAlgs: []string{"ES256"}})

// login: v := oauth2.GenerateVerifier(); save v + state in a cookie
//        http.Redirect(w, r, conf.AuthCodeURL(state, oauth2.S256ChallengeOption(v)), http.StatusFound)
// callback:
tok, _ := conf.Exchange(ctx, r.URL.Query().Get("code"), oauth2.VerifierOption(v))
idt, _ := verifier.Verify(ctx, tok.Extra("id_token").(string))
var claims struct{ Sub, Name, Email string; StudentVerified bool \`json:"student_verified"\` }
idt.Claims(&claims)`,
  },
  {
    id: "expo",
    title: "React Native / Expo (expo-auth-session)",
    callback: "yourapp://oauth (register as a Browser or mobile app)",
    install: "npx expo install expo-auth-session expo-crypto",
    code: `import * as AuthSession from "expo-auth-session";

const discovery = AuthSession.useAutoDiscovery("${ISSUER}");
const redirectUri = AuthSession.makeRedirectUri({ scheme: "yourapp", path: "oauth" });
const [request, response, promptAsync] = AuthSession.useAuthRequest(
  { clientId: process.env.EXPO_PUBLIC_CAMPUSLOOP_CLIENT_ID!, scopes: ["openid", "profile", "email", "student"], redirectUri, usePKCE: true },
  discovery
);

useEffect(() => {
  if (response?.type === "success" && discovery && request) {
    AuthSession.exchangeCodeAsync(
      { clientId: process.env.EXPO_PUBLIC_CAMPUSLOOP_CLIENT_ID!, code: response.params.code, redirectUri, extraParams: { code_verifier: request.codeVerifier! } },
      discovery
    ).then((t) => fetch("${ENDPOINTS.userinfo}", { headers: { Authorization: \`Bearer \${t.accessToken}\` } }));
  }
}, [response]);
// <Button title="Continue with CampusLoop" disabled={!request} onPress={() => promptAsync()} />`,
  },
  {
    id: "flutter",
    title: "Flutter (flutter_appauth)",
    callback: "com.yourapp:/oauth (register as a Browser or mobile app)",
    code: `final result = await const FlutterAppAuth().authorizeAndExchangeCode(
  AuthorizationTokenRequest(
    const String.fromEnvironment('CAMPUSLOOP_CLIENT_ID'),
    'com.yourapp:/oauth',
    discoveryUrl: '${ISSUER}/.well-known/openid-configuration',
    scopes: ['openid', 'profile', 'email', 'student'],
  ),
);
// result.idToken / result.accessToken; read claims from ${ENDPOINTS.userinfo}`,
  },
  {
    id: "hosted",
    title: "Clerk, Firebase Identity Platform, Auth0 and other hosted auth",
    callback: "the callback URL your auth provider shows you",
    code: `Add a custom OpenID Connect provider in your auth dashboard:
- Discovery / issuer URL: ${ISSUER}/.well-known/openid-configuration  (issuer: ${ISSUER})
- Client ID: CAMPUSLOOP_CLIENT_ID      Client secret: CAMPUSLOOP_CLIENT_SECRET
- Scopes: ${DEFAULT_SCOPE}
- Flow: authorization code (PKCE if offered); id_token signing algorithm ES256
Then add the provider's callback URL to your app's redirect URIs at ${ISSUER}/developer.`,
  },
];

/** The full SKILL.md. With keys it is a ready-to-run prompt; without, it is the public reference. */
export function buildSkillMarkdown(k: SkillKeys = {}): string {
  const uris = k.redirectUris?.length ? k.redirectUris : null;
  return `---
name: login-with-campusloop
description: Add "Login with CampusLoop" (OpenID Connect) to any web or mobile app so users sign in with CampusLoop and the app learns whether they are verified college students in India. Use when asked to add CampusLoop login, student verification, or "Sign in with CampusLoop".
---

# Login with CampusLoop

CampusLoop is a verified-student network for Indian colleges. It is a standard **OpenID Connect provider**:
Authorization Code flow with **PKCE (S256)**, ES256-signed tokens, discovery at
\`${ISSUER}/.well-known/openid-configuration\`. Any OIDC library works.
Docs for humans: ${ISSUER}/developers

## 1. Credentials${k.appName ? ` for ${k.appName}` : ""}

Add these to the project's \`.env\` (create it if missing):

\`\`\`dotenv
${env(k)}
\`\`\`
${k.clientSecret || k.publicClient ? "" : `
If the secret above is a placeholder, ask the user for it. CampusLoop shows a secret once; they can rotate it at ${ISSUER}/developer.
Browser-only and mobile apps (PKCE, "Browser or mobile app" type) have no secret: omit CAMPUSLOOP_CLIENT_SECRET.
`}
${uris ? `Registered redirect URIs (the callback must match one of these exactly):\n${uris.map((u) => `- ${u}`).join("\n")}\n` : `The callback URL must exactly match a redirect URI registered at ${ISSUER}/developer (https, or http://localhost for development).\n`}
## 2. What the agent must do

1. Detect the framework and auth library already in the project. Prefer the existing library; otherwise use the recipe in section 4 for the stack (Better Auth or Auth.js for Next.js).
2. Install the library, then add the provider exactly as in the recipe. Issuer: \`${ISSUER}\`. Scope: \`${DEFAULT_SCOPE}\` (add \`offline_access\` only if refresh tokens are needed).
3. Make the callback path match a registered redirect URI${uris ? " listed above" : ""}. If the project's callback differs, tell the user to add it at ${ISSUER}/developer.
4. Put the variables in \`.env\`. Make sure \`.env\` is listed in \`.gitignore\` (add it if missing). Add a \`.env.example\` with the same keys but **no secret values**. Never commit the client secret, print it in logs, or send it to the browser.
5. Add a "Continue with CampusLoop" button. Use the official asset (${ISSUER}/oauth/button-light.svg or button-dark.svg) or the text "Continue with CampusLoop" with the logo ${ISSUER}/oauth/icon.svg.
6. Store users by \`sub\` (stable per app). Use \`student_verified === true\` to unlock student-only features.
7. Remind the user to add the same variables to their hosting provider (Vercel, Cloudflare, Netlify, Render...) before deploying.
8. Run the app's build or type check, then commit the code (without \`.env\`) and push to the current branch.

## 3. Claims

| Scope | Claims |
|---|---|
| openid | \`sub\` (pairwise: unique per app, stable) |
| profile | \`name\`, \`preferred_username\`, \`picture\`, \`profile\` |
| email | \`email\` |
| student | \`student_verified\` (boolean), \`verification_method\` ("college_email") |
| college | \`college\`: \`{ id, name, slug, state }\` |
| academic | \`branch\`, \`degree\`, \`year\` |
| offline_access | a rotating \`refresh_token\` (30 days) |

Endpoints: authorize ${ENDPOINTS.authorization} · token ${ENDPOINTS.token} · userinfo ${ENDPOINTS.userinfo} · jwks ${ENDPOINTS.jwks} · revoke ${ENDPOINTS.revocation}.
Access tokens last 1 hour. id_tokens are ES256 JWTs (\`iss\` ${ISSUER}, \`aud\` = client ID). Configure ES256 where a library defaults to RS256.

## 4. Recipes

${RECIPES.map((r) => `### ${r.title}\nCallback path: \`${r.callback}\`${r.install ? `\nInstall: \`${r.install}\`` : ""}\n\n\`\`\`\n${r.code}\n\`\`\``).join("\n\n")}

## 5. Verify an id_token on your server (any Node backend)

\`\`\`ts
import { createRemoteJWKSet, jwtVerify } from "jose";
const JWKS = createRemoteJWKSet(new URL("${ENDPOINTS.jwks}"));
const { payload } = await jwtVerify(idToken, JWKS, { issuer: "${ISSUER}", audience: process.env.CAMPUSLOOP_CLIENT_ID });
\`\`\`

## 6. Troubleshooting

- "redirect address ... not registered": add the exact callback URL (scheme, host, port, path) at ${ISSUER}/developer.
- \`invalid_client\`: wrong client ID or secret, or a browser app sending a secret. Rotate the secret in the portal if lost.
- \`invalid_grant\` with PKCE: send the same \`code_verifier\` used to make the \`code_challenge\`; codes expire after 60 seconds and work once.
- Signature errors: the library must accept ES256.
- 429: slow down; limits are per IP per minute.
`;
}

/** Short prompt: points the agent at the hosted SKILL.md and passes the keys. */
export function shortAgentPrompt(k: SkillKeys): string {
  return `Add "Login with CampusLoop" to this project. Read and follow ${SKILL_URL} exactly.

Credentials (put them in .env, never commit them):
${env(k)}
${k.redirectUris?.length ? `\nRegistered redirect URIs (use the matching callback path):\n${k.redirectUris.map((u) => `- ${u}`).join("\n")}\n` : ""}
Implement sign-in with the recipe for this project's stack, add the "Continue with CampusLoop" button, make sure .env is gitignored, run the build, then commit and push the code (without .env).`;
}

/** Full prompt: the whole skill inline, so the agent needs no web access. */
export function fullAgentPrompt(k: SkillKeys): string {
  return `Add "Login with CampusLoop" to this project using the instructions below. Follow them exactly, then commit and push the code (never commit .env).\n\n${buildSkillMarkdown(k)}`;
}
