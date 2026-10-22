import { ISSUER } from "@/lib/oauth/config";

/** Copy-paste setup snippets, prefilled with the app's client ID. Used in the portal and on /developers. */
export function quickstartSnippets(clientId = "YOUR_CLIENT_ID", scope = "openid profile student") {
  return [
    {
      id: "authjs",
      title: "Next.js (Auth.js / NextAuth v5)",
      code: `// auth.ts
import NextAuth from "next-auth";

export const { handlers, auth, signIn } = NextAuth({
  providers: [
    {
      id: "campusloop",
      name: "CampusLoop",
      type: "oidc",
      issuer: "${ISSUER}",
      clientId: process.env.CAMPUSLOOP_CLIENT_ID, // ${clientId}
      clientSecret: process.env.CAMPUSLOOP_CLIENT_SECRET,
      authorization: { params: { scope: "${scope}" } },
      checks: ["pkce", "state", "nonce"],
    },
  ],
  callbacks: {
    // Expose the verified-student claim to your app
    jwt({ token, profile }) {
      if (profile) token.studentVerified = profile.student_verified === true;
      return token;
    },
  },
});
// Redirect URI: https://YOUR_DOMAIN/api/auth/callback/campusloop`,
    },
    {
      id: "sdk",
      title: "Any website (no build step)",
      code: `<div id="campusloop-login"></div>
<script src="${ISSUER}/sdk/v1/campusloop.js"></script>
<script>
  CampusLoop.init({ clientId: "${clientId}", redirectUri: location.origin + "/callback.html", scope: "${scope}" });
  CampusLoop.renderButton(document.getElementById("campusloop-login"));
</script>

<!-- callback.html -->
<script src="${ISSUER}/sdk/v1/campusloop.js"></script>
<script>
  CampusLoop.init({ clientId: "${clientId}", redirectUri: location.origin + "/callback.html" });
  CampusLoop.handleRedirect().then(({ user, idToken }) => {
    // Send idToken to your server and verify it (see "Verify on your server").
    console.log(user.name, user.student_verified);
  });
</script>`,
    },
    {
      id: "verify",
      title: "Verify on your server (Node)",
      code: `import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(new URL("${ISSUER}/oauth/jwks.json"));

export async function verifyCampusLoopIdToken(idToken: string) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: "${ISSUER}",
    audience: "${clientId}",
  });
  return payload; // { sub, name, picture, student_verified, ... }
}`,
    },
    {
      id: "http",
      title: "Any OIDC library or plain HTTP",
      code: `Issuer / discovery: ${ISSUER}/.well-known/openid-configuration

1. Redirect the user to:
   ${ISSUER}/oauth/authorize?response_type=code&client_id=${clientId}
     &redirect_uri=YOUR_REDIRECT_URI&scope=${encodeURIComponent(scope)}
     &state=RANDOM&code_challenge=S256_CHALLENGE&code_challenge_method=S256

2. Exchange the code:
   curl -X POST ${ISSUER}/oauth/token \\
     -u "${clientId}:YOUR_CLIENT_SECRET" \\
     -d grant_type=authorization_code -d code=CODE \\
     -d redirect_uri=YOUR_REDIRECT_URI -d code_verifier=VERIFIER

3. Read the user:
   curl ${ISSUER}/oauth/userinfo -H "Authorization: Bearer ACCESS_TOKEN"`,
    },
  ];
}

export function Quickstart({ clientId, scope }: { clientId?: string; scope?: string }) {
  return (
    <div className="space-y-4">
      {quickstartSnippets(clientId, scope).map((s) => (
        <details key={s.id} className="group rounded-2xl bg-card/60 shadow-2xs" open={s.id === "authjs"}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold text-foreground">
            {s.title}
            <span className="text-xs font-semibold text-primary group-open:hidden">Show</span>
          </summary>
          <pre className="overflow-x-auto border-t border-border/40 p-4 text-[12.5px] leading-relaxed text-foreground"><code>{s.code}</code></pre>
        </details>
      ))}
    </div>
  );
}
