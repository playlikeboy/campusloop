import type { OauthClient } from "@/db/schema";

/** Browser (PUBLIC, PKCE) apps may call the token endpoint from the origins of their registered redirect URIs. */
export function tokenCorsHeaders(origin: string | null, client?: OauthClient | null): Record<string, string> {
  if (!origin || !client || client.type !== "PUBLIC") return {};
  const allowed = client.redirectUris.some((u) => {
    try {
      return new URL(u).origin === origin;
    } catch {
      return false;
    }
  });
  return allowed ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
}

export const PREFLIGHT = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/** Token and revoke endpoints accept form bodies (spec) and JSON (convenience). */
export async function readBody(req: Request): Promise<URLSearchParams> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return new URLSearchParams(
      Object.entries(json).filter(([, v]) => typeof v === "string") as [string, string][]
    );
  }
  return new URLSearchParams(await req.text());
}
