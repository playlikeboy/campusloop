import { ISSUER } from "@/lib/oauth/config";
import { RECIPES } from "@/lib/oauth/skill";

const VERIFY = `import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(new URL("${ISSUER}/oauth/jwks.json"));

export async function verifyCampusLoopIdToken(idToken: string) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: "${ISSUER}",
    audience: process.env.CAMPUSLOOP_CLIENT_ID,
  });
  return payload; // { sub, name, email, picture, student_verified, college, ... }
}`;

/** Every framework recipe (shared with SKILL.md), with the app's client ID filled into browser snippets. */
export function Quickstart({ clientId, open = "better-auth" }: { clientId?: string; open?: string }) {
  const fill = (code: string) =>
    clientId ? code.replaceAll('"CAMPUSLOOP_CLIENT_ID"', `"${clientId}"`) : code;
  return (
    <div className="space-y-3">
      {RECIPES.map((r) => (
        <details
          key={r.id}
          id={r.id}
          className="group scroll-mt-24 rounded-lg border border-border bg-surface"
          open={r.id === open}
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-fg">
            {r.title}
            <span className="shrink-0 text-xs font-semibold text-brand-text group-open:hidden">Show</span>
          </summary>
          <div className="border-t border-border px-4 pb-4 pt-3">
            <p className="text-xs text-fg-muted">
              Redirect URI path: <code className="font-mono text-fg">{r.callback}</code>
              {r.install && (
                <>
                  {" "}
                  · Install: <code className="font-mono text-fg">{r.install}</code>
                </>
              )}
            </p>
            <pre className="mt-3 overflow-x-auto rounded-md bg-surface-muted p-3 text-sm leading-relaxed text-fg">
              <code>{fill(r.code)}</code>
            </pre>
          </div>
        </details>
      ))}
      <details id="verify" className="group scroll-mt-24 rounded-lg border border-border bg-surface">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-fg">
          Verify an id_token on your server
          <span className="text-xs font-semibold text-brand-text group-open:hidden">Show</span>
        </summary>
        <pre className="overflow-x-auto border-t border-border p-4 text-sm leading-relaxed text-fg">
          <code>{VERIFY}</code>
        </pre>
      </details>
    </div>
  );
}
