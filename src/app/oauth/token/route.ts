import { NextResponse } from "next/server";
import { OAuthError, oauthErrorResponse } from "@/lib/oauth/errors";
import {
  authenticateClient,
  exchangeCode,
  getActiveGrant,
  getClient,
  issueTokens,
  refreshTokens,
} from "@/lib/oauth/store";
import { PREFLIGHT, readBody, tokenCorsHeaders } from "../cors";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: PREFLIGHT });
}

/** OAuth 2.0 token endpoint: authorization_code (with PKCE) and refresh_token. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const body = await readBody(req);
  let cors: Record<string, string> = {};
  try {
    cors = tokenCorsHeaders(origin, await getClient(body.get("client_id")));
    const client = await authenticateClient(req.headers.get("authorization"), body);
    cors = tokenCorsHeaders(origin, client);
    const grantType = body.get("grant_type");

    if (grantType === "authorization_code") {
      const code = body.get("code");
      if (!code) throw new OAuthError("invalid_request", "code is required");
      const row = await exchangeCode({
        client,
        code,
        redirectUri: body.get("redirect_uri"),
        codeVerifier: body.get("code_verifier"),
      });
      const grant = await getActiveGrant(client.id, row.profileId);
      if (!grant) throw new OAuthError("invalid_grant", "Access was revoked");
      const tokens = await issueTokens({ client, grant, scopes: row.scopes, nonce: row.nonce });
      return NextResponse.json(tokens, {
        headers: { "Cache-Control": "no-store", Pragma: "no-cache", ...cors },
      });
    }

    if (grantType === "refresh_token") {
      const refreshToken = body.get("refresh_token");
      if (!refreshToken) throw new OAuthError("invalid_request", "refresh_token is required");
      const tokens = await refreshTokens({ client, refreshToken, scope: body.get("scope") });
      return NextResponse.json(tokens, {
        headers: { "Cache-Control": "no-store", Pragma: "no-cache", ...cors },
      });
    }

    throw new OAuthError("unsupported_grant_type", "Use authorization_code or refresh_token");
  } catch (err) {
    return oauthErrorResponse(err, cors);
  }
}
