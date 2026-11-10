import { NextResponse } from "next/server";
import { jwks } from "@/lib/oauth/keys";

/** Public keys for verifying CampusLoop id_tokens and access tokens. */
export async function GET() {
  return NextResponse.json(await jwks(), {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=900" },
  });
}
