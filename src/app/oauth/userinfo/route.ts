import { NextResponse } from "next/server";
import { OAuthError, oauthErrorResponse } from "@/lib/oauth/errors";
import { userInfo } from "@/lib/oauth/store";

export const dynamic = "force-dynamic";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...CORS, "Access-Control-Max-Age": "86400" } });
}

async function handle(req: Request) {
  try {
    const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) throw new OAuthError("invalid_token", "Missing bearer token", 401);
    return NextResponse.json(await userInfo(token), { headers: { ...CORS, "Cache-Control": "no-store" } });
  } catch (err) {
    return oauthErrorResponse(err, CORS);
  }
}

/** OIDC UserInfo: claims for the scopes the access token carries. */
export const GET = handle;
export const POST = handle;
