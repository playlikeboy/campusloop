import { and, eq, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import {
  checkVerifyState,
  exchangeCodeForToken,
  fetchGithubIdentity,
  fetchStudentStatus,
  GITHUB_VERIFY_COOKIE,
  getGithubVerifyConfig,
  revokeGithubToken,
} from "@/lib/github-verify";
import { creditInviter } from "@/lib/referrals/credit";
import { getCachedAuthUser, getCachedBareProfile, invalidateProfileCache } from "@/lib/server-cache";
import { isVerifiedStudent } from "@/lib/trust";

export const dynamic = "force-dynamic";

/**
 * Step 2 of GitHub Student Pack verification. Checks the CSRF state, trades the
 * code for a token, reads the GitHub identity and student status, revokes the
 * token, and marks the profile verified. The token is never stored.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;
  const finish = (code: string) => {
    const res = NextResponse.redirect(new URL(`/settings/verify?github=${code}`, origin));
    res.cookies.set(GITHUB_VERIFY_COOKIE, "", { path: "/api/verify/github", maxAge: 0 });
    return res;
  };

  const user = await getCachedAuthUser().catch(() => null);
  if (!user) return NextResponse.redirect(new URL("/sign-in?returnTo=/settings/verify", origin));
  const profile = await getCachedBareProfile(user.id);
  if (!profile) return NextResponse.redirect(new URL("/onboarding", origin));

  const stateCheck = checkVerifyState(
    req.cookies.get(GITHUB_VERIFY_COOKIE)?.value,
    url.searchParams.get("state"),
    profile.id
  );
  if (!stateCheck.ok) return finish("state");

  if (url.searchParams.get("error")) return finish("denied");
  const code = url.searchParams.get("code");
  if (!code) return finish("error");

  if (isVerifiedStudent(profile)) return finish("already");

  const config = getGithubVerifyConfig();
  if (!config) return finish("not_configured");

  let token: string | null = null;
  try {
    token = await exchangeCodeForToken(config, code, `${origin}/api/verify/github/callback`, stateCheck.verifier);
    if (!token) return finish("error");

    const [identity, status] = await Promise.all([fetchGithubIdentity(token), fetchStudentStatus(token)]);
    if (!identity) return finish("error");
    if (status === "not_student") return finish("not_student");
    if (status !== "student") return finish("unknown");

    const db = getDb();
    const claimed = await db.query.userProfiles.findFirst({
      where: and(eq(userProfiles.githubUserId, identity.id), ne(userProfiles.id, profile.id)),
      columns: { id: true },
    });
    if (claimed) return finish("taken");

    try {
      await db
        .update(userProfiles)
        .set({
          isCollegeVerified: true,
          verificationMethod: "github_student",
          verifiedAt: new Date(),
          githubUserId: identity.id,
          githubLogin: identity.login,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.id, profile.id));
    } catch (error) {
      // The unique index on github_user_id closes the race between two profiles.
      if ((error as { code?: string }).code === "23505") return finish("taken");
      throw error;
    }
    invalidateProfileCache(user.id);

    // Same as the college email upgrade: the first verification credits the inviter.
    if (profile.referredById && profile.referredById !== profile.id) {
      await creditInviter(profile.referredById, profile.id).catch((error) =>
        console.error("[verify/github] Failed to credit inviter:", error)
      );
    }
    return finish("verified");
  } catch (error) {
    console.error("[verify/github] callback failed:", error);
    return finish("error");
  } finally {
    if (token) await revokeGithubToken(config, token);
  }
}
