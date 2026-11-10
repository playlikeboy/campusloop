import { NextResponse } from "next/server";
import { discoveryDocument } from "@/lib/oauth/config";

/** OpenID Connect discovery for Login with CampusLoop. */
export function GET() {
  return NextResponse.json(discoveryDocument(), {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" },
  });
}
