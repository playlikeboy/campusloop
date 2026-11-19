import { type NextRequest, NextResponse } from "next/server";
import {
  buildJoinTarget,
  cleanInviteCode,
  INVITE_COOKIE,
  INVITE_COOKIE_MAX_AGE,
} from "@/lib/referrals/invite";

export const dynamic = "force-dynamic";

/**
 * Invite link entry point: `/join?invite=<username>`.
 * A route handler, because a cookie cannot be set while rendering a page.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const inviter = cleanInviteCode(params.get("invite") ?? params.get("ref"));

  const response = NextResponse.redirect(new URL(buildJoinTarget(params), request.url), 307);
  if (inviter) {
    response.cookies.set(INVITE_COOKIE, inviter, {
      path: "/",
      maxAge: INVITE_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}
