import { NextResponse } from "next/server";

/** RFC 6749 section 5.2 / RFC 6750 error responses. */
export type OAuthErrorCode =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unauthorized_client"
  | "unsupported_grant_type"
  | "invalid_scope"
  | "invalid_token"
  | "access_denied"
  | "login_required"
  | "consent_required"
  | "slow_down"
  | "server_error";

export class OAuthError extends Error {
  constructor(
    public code: OAuthErrorCode,
    public description: string,
    public status = 400
  ) {
    super(description);
  }
}

export function oauthErrorResponse(err: unknown, headers: Record<string, string> = {}): NextResponse {
  const e = err instanceof OAuthError ? err : new OAuthError("server_error", "Something went wrong", 500);
  if (!(err instanceof OAuthError)) console.error("[oauth]", err);
  const extra: Record<string, string> = { "Cache-Control": "no-store", Pragma: "no-cache", ...headers };
  if (e.code === "invalid_client" && e.status === 401) extra["WWW-Authenticate"] = 'Basic realm="campusloop"';
  if (e.code === "invalid_token") extra["WWW-Authenticate"] = `Bearer error="invalid_token", error_description="${e.description}"`;
  return NextResponse.json({ error: e.code, error_description: e.description }, { status: e.status, headers: extra });
}
