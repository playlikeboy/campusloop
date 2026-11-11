import { NextResponse } from "next/server";
import { getCachedAuthUser, getCachedBareProfile } from "@/lib/server-cache";

/**
 * requireProfile()
 * ----------------
 * Result-returning (non-throwing) replacement for the auth + profile block that
 * every authenticated API route used to copy:
 *
 *   const user = await hexclaveServerApp.getUser();
 *   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   const profile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) });
 *   if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
 *
 * becomes
 *
 *   const auth = await requireProfile();            // or requireProfile({ profileStatus: 403 })
 *   if (!auth.ok) return auth.response;
 *   const { user, profile } = auth;
 *
 * Status codes and bodies are identical to the old inline block. Routes that
 * historically answered 403 for a missing profile pass `profileStatus: 403`.
 * `rejectViewerWrite(profile)` is intentionally not folded in: routes keep
 * calling it themselves so its position relative to other checks is unchanged.
 *
 * Both lookups are memoized per request with React `cache` and cached per
 * Worker isolate for 30s (see `src/lib/server-cache.ts`), so a layout, page,
 * or metadata function that already resolved the same user/profile shares
 * the result. The profile is the bare row (no relations) to match what
 * routes returned before; use `getCachedUserProfile` when the institution
 * relation is needed.
 */

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getCachedAuthUser>>>;
export type AuthProfile = NonNullable<Awaited<ReturnType<typeof getCachedBareProfile>>>;

export type RequireProfileResult =
  | { ok: true; user: AuthUser; profile: AuthProfile }
  | { ok: false; response: NextResponse; user: AuthUser | null; profile: null };

export interface RequireProfileOptions {
  /** HTTP status for a signed-in user with no profile row. Default 404. */
  profileStatus?: 403 | 404;
}

export async function requireProfile(options: RequireProfileOptions = {}): Promise<RequireProfileResult> {
  const user = await getCachedAuthUser();
  if (!user) {
    return {
      ok: false,
      user: null,
      profile: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const profile = await getCachedBareProfile(user.id);
  if (!profile) {
    return {
      ok: false,
      user,
      profile: null,
      response: NextResponse.json({ error: "Profile not found" }, { status: options.profileStatus ?? 404 }),
    };
  }

  return { ok: true, user, profile };
}
