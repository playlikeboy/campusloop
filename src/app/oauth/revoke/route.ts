import { NextResponse } from "next/server";
import { OAuthError, oauthErrorResponse } from "@/lib/oauth/errors";
import { authenticateClient, getClient, revokeToken } from "@/lib/oauth/store";
import { PREFLIGHT, readBody, tokenCorsHeaders } from "../cors";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: PREFLIGHT });
}

/** RFC 7009 token revocation (sign-out from the app). Always 200 for unknown tokens. */
export async function POST(req: Request) {
  const body = await readBody(req);
  const cors = tokenCorsHeaders(req.headers.get("origin"), await getClient(body.get("client_id")));
  try {
    const client = await authenticateClient(req.headers.get("authorization"), body);
    const token = body.get("token");
    if (!token) throw new OAuthError("invalid_request", "token is required");
    await revokeToken(client, token);
    return new NextResponse(null, { status: 200, headers: { "Cache-Control": "no-store", ...cors } });
  } catch (err) {
    return oauthErrorResponse(err, cors);
  }
}
