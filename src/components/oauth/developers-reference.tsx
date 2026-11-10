import { ENDPOINTS, ISSUER, SCOPES } from "@/lib/oauth/config";
import { SKILL_URL } from "@/lib/oauth/skill";

const code = "rounded-sm bg-surface-muted px-1.5 py-0.5 font-mono text-[0.9em] text-fg";

/** Scopes table, endpoint list and brand rules for /developers. */
export function DevelopersReference() {
  const endpoints: [string, string][] = [
    ["Agent skill", SKILL_URL],
    ["Discovery", `${ISSUER}/.well-known/openid-configuration`],
    ["Authorization", ENDPOINTS.authorization],
    ["Token", ENDPOINTS.token],
    ["UserInfo", ENDPOINTS.userinfo],
    ["JWKS", ENDPOINTS.jwks],
    ["Revocation", ENDPOINTS.revocation],
    ["JS SDK", `${ISSUER}/sdk/v1/campusloop.js`],
  ];
  return (
    <>
      <section aria-labelledby="scopes" className="mt-16">
        <h2 id="scopes" className="text-2xl text-fg sm:text-3xl">
          Scopes and claims
        </h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs text-fg-muted">
              <tr>
                <th scope="col" className="p-3 font-semibold">
                  Scope
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Claims
                </th>
                <th scope="col" className="p-3 font-semibold">
                  What the student sees
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SCOPES).map(([s, info]) => (
                <tr key={s} className="border-t border-border">
                  <td className="p-3 font-mono font-semibold text-fg">{s}</td>
                  <td className="p-3 font-mono text-xs text-fg">
                    {info.claims.join(", ") || "refresh_token"}
                  </td>
                  <td className="p-3 text-fg-muted">{info.consent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="endpoints" className="mt-16">
        <h2 id="endpoints" className="text-2xl text-fg sm:text-3xl">
          Endpoints
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[180px_1fr]">
          {endpoints.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-semibold text-fg">{k}</dt>
              <dd className="break-all font-mono text-xs text-fg-muted sm:text-sm">{v}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-6 list-disc space-y-1.5 pl-5 text-sm text-fg-muted">
          <li>
            Flow: Authorization Code with PKCE (S256). PKCE is required for browser and mobile apps and
            recommended for all.
          </li>
          <li>
            Tokens: ES256 JWTs. Access tokens last 1 hour. Refresh tokens (scope{" "}
            <code className={code}>offline_access</code>) last 30 days and rotate on every use. Reusing an old
            refresh token ends the session.
          </li>
          <li>
            Redirect URIs must match exactly. Use https, http://localhost for development, or an app scheme
            like com.example.app:/callback.
          </li>
          <li>
            The redirect includes <code className={code}>iss</code> (RFC 9207). Check it if your library
            supports it.
          </li>
        </ul>
      </section>

      <section aria-labelledby="rules" className="mt-16">
        <h2 id="rules" className="text-2xl text-fg sm:text-3xl">
          Brand and usage rules
        </h2>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-fg-muted">
          <li>
            Use the official buttons or the SDK button. Don't change the logo or colours, and keep the text
            "Continue with CampusLoop" or "Sign in with CampusLoop".
          </li>
          <li>Don't name your app "CampusLoop" or suggest CampusLoop runs it.</li>
          <li>
            Ask only for the scopes you need, explain why in your privacy policy, and never sell student data.
          </li>
          <li>Apps that misuse student data are suspended, which signs every student out of them.</li>
        </ul>
      </section>
    </>
  );
}
