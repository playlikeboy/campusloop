import { NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  createVerifyState,
  encodeVerifyState,
  GITHUB_VERIFY_COOKIE,
  GITHUB_VERIFY_TTL_SEC,
  getGithubVerifyConfig,
  pkceChallenge,
} from "@/lib/github-verify";
import { getCachedAuthUser, getCachedBareProfile } from "@/lib/server-cache";
import { isVerifiedStudent } from "@/lib/trust";

export const dynamic = "force-dynamic";

/** Step 1 of GitHub Student Pack verification: send the student to GitHub. */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const back = (code: string) => NextResponse.redirect(new URL(`/settings/verify?github=${code}`, origin));

  const user = await getCachedAuthUser().catch(() => null);
  if (!user) return NextResponse.redirect(new URL("/sign-in?returnTo=/settings/verify", origin));
  const profile = await getCachedBareProfile(user.id);
  if (!profile) return NextResponse.redirect(new URL("/onboarding", origin));
  if (isVerifiedStudent(profile)) return back("already");

  const config = getGithubVerifyConfig();
  if (!config) return back("not_configured");

  const state = createVerifyState(profile.id);
  const url = buildAuthorizeUrl({
    clientId: config.clientId,
    redirectUri: `${origin}/api/verify/github/callback`,
    state: state.state,
    codeChallenge: await pkceChallenge(state.verifier),
  });

  const res = NextResponse.redirect(url);
  res.cookies.set(GITHUB_VERIFY_COOKIE, encodeVerifyState(state), {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/api/verify/github",
    maxAge: GITHUB_VERIFY_TTL_SEC,
  });
  return res;
}
