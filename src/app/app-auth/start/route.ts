import { type NextRequest, NextResponse } from "next/server";
import { APP_OAUTH_COOKIE, APP_OAUTH_COOKIE_MAX_AGE, isAllowedProviderUrl } from "@/lib/native-app/oauth-handoff";

export const dynamic = "force-dynamic";

/**
 * Opened by the CampusLoop Web Android app in a Custom Tab. Marks this browser as being in an
 * app sign-in, then forwards to the OAuth provider. See src/lib/native-app/oauth-handoff.ts.
 */
export function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to");
  if (!isAllowedProviderUrl(to)) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl.origin), 303);
  }
  const res = NextResponse.redirect(to, 303);
  res.cookies.set(APP_OAUTH_COOKIE, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: APP_OAUTH_COOKIE_MAX_AGE,
  });
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
