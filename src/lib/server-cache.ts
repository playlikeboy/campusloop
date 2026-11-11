import { asc, eq, ilike, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "@/db";
import { comments, communities, institutions, posts, type UserProfile, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { IsolateCache } from "@/lib/isolate-cache";

/**
 * Plain-data snapshot of the signed-in Hexclave user.
 *
 * The SDK's user object carries methods (update, listContactChannels, ...)
 * bound to the token store of the request that created it. A snapshot can be
 * shared across requests in an isolate without leaking one request's session
 * into another, so only data fields are kept. Code that needs SDK methods must
 * call `hexclaveServerApp.getUser()` directly (the upgrade-campus routes do).
 */
export type CachedAuthUser = {
  id: string;
  primaryEmail: string | null;
  primaryEmailVerified: boolean;
  displayName: string | null;
  profileImageUrl: string | null;
};

/** Hexclave access-token cookie (current name, then the legacy Stack Auth name). */
export const ACCESS_TOKEN_COOKIES = ["hexclave-access", "stack-access"] as const;
/** Refresh-token cookie name prefixes (`hexclave-refresh-<projectId>`, structured and legacy variants). */
const REFRESH_TOKEN_COOKIE_PREFIXES = ["hexclave-refresh-", "__Host-hexclave-refresh-", "stack-refresh"];

const AUTH_TTL_MS = 30_000;
const PROFILE_TTL_MS = 30_000;

// Module scope: shared by every request this Worker isolate serves.
const authUserCache = new IsolateCache<CachedAuthUser>(AUTH_TTL_MS, 1000);
const userProfileCache = new IsolateCache<NonNullable<Awaited<ReturnType<typeof loadUserProfile>>>>(PROFILE_TTL_MS, 1000);
const bareProfileCache = new IsolateCache<NonNullable<Awaited<ReturnType<typeof loadBareProfile>>>>(PROFILE_TTL_MS, 1000);

/** SHA-256 hex digest. The raw token is never used as a cache key. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

type CookieReader = { get(name: string): { value: string } | undefined; getAll(): { name: string }[] };

/**
 * Resolves the isolate cache key for the current request's auth cookies.
 * - `{ kind: "anonymous" }`: no access and no refresh cookie, so signed out.
 * - `{ kind: "refresh-only" }`: access cookie missing but a refresh cookie exists;
 *   Hexclave must mint a new access token, so the caller must not use the cache.
 * - `{ kind: "key", key }`: SHA-256 of the access-token cookie value.
 */
export async function getAuthCacheKey(
  jar: CookieReader
): Promise<{ kind: "anonymous" } | { kind: "refresh-only" } | { kind: "key"; key: string }> {
  for (const name of ACCESS_TOKEN_COOKIES) {
    const value = jar.get(name)?.value;
    if (value) return { kind: "key", key: await sha256Hex(value) };
  }
  const hasRefresh = jar.getAll().some((c) => REFRESH_TOKEN_COOKIE_PREFIXES.some((p) => c.name.startsWith(p)));
  return hasRefresh ? { kind: "refresh-only" } : { kind: "anonymous" };
}

function toAuthSnapshot(
  user: Awaited<ReturnType<typeof hexclaveServerApp.getUser>>
): CachedAuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    primaryEmail: user.primaryEmail,
    primaryEmailVerified: user.primaryEmailVerified,
    displayName: user.displayName,
    profileImageUrl: user.profileImageUrl,
  };
}

/**
 * Current Hexclave user, memoized per request (React `cache`) and per isolate
 * for 30s keyed by a hash of the access-token cookie. Hexclave's own cache is
 * per request, so without this every render paid a remote GET /users/me.
 *
 * Trade-off: a session revoked elsewhere (sign-out on another device, ban) can
 * stay valid for up to 30s in an isolate that already cached it. Signing out in
 * this browser deletes the cookie, so the key disappears immediately. Null
 * results are never cached. Write paths that need a fresh session or SDK
 * methods keep calling `hexclaveServerApp.getUser()` directly.
 */
export const getCachedAuthUser = cache(async (): Promise<CachedAuthUser | null> => {
  let jar: CookieReader;
  try {
    jar = await cookies();
  } catch {
    // Outside a request scope (unit tests, scripts): no cookie jar to key on.
    return toAuthSnapshot(await hexclaveServerApp.getUser());
  }

  const cacheKey = await getAuthCacheKey(jar);
  if (cacheKey.kind === "anonymous") return null;
  if (cacheKey.kind === "refresh-only") return toAuthSnapshot(await hexclaveServerApp.getUser());

  const hit = authUserCache.get(cacheKey.key);
  if (hit) return hit;

  const user = toAuthSnapshot(await hexclaveServerApp.getUser());
  if (user) authUserCache.set(cacheKey.key, user);
  return user;
});

async function loadUserProfile(userId: string) {
  const db = getDb();
  return await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
    with: {
      institution: true,
    },
  });
}

async function loadBareProfile(userId: string) {
  const db = getDb();
  return await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });
}

/**
 * User Profile with Institution relation, memoized per request and cached per
 * isolate for 30s by Hexclave user id. Missing profiles are not cached (the
 * onboarding flow creates one right after). Returned objects are shared across
 * requests: treat them as read-only.
 */
export const getCachedUserProfile = cache(async (userId: string) => {
  if (!userId) return null;
  const hit = userProfileCache.get(userId);
  if (hit) return hit;
  const profile = await loadUserProfile(userId);
  if (profile) userProfileCache.set(userId, profile);
  return profile ?? null;
});

/**
 * Bare profile row (no relations), memoized per request and cached per isolate
 * for 30s by Hexclave user id. Used by `requireProfile()`. Read-only, as above.
 */
export const getCachedBareProfile = cache(async (userId: string) => {
  if (!userId) return null;
  const hit = bareProfileCache.get(userId);
  if (hit) return hit;
  const profile = await loadBareProfile(userId);
  if (profile) bareProfileCache.set(userId, profile);
  return profile ?? null;
});

/**
 * Drops the isolate-cached profile rows for a Hexclave user id. Call after any
 * write to that user's `user_profiles` row. Other isolates converge within the
 * 30s TTL.
 */
export function invalidateProfileCache(userId: string | null | undefined): void {
  if (!userId) return;
  userProfileCache.delete(userId);
  bareProfileCache.delete(userId);
}

/**
 * The profile fields the app chrome (AppShell, sidebar, top bar, account menu,
 * mobile drawer, bottom nav) reads. Layouts pass this instead of the full row so
 * the RSC payload does not serialize every profile column and the institution.
 */
export type ShellProfile = Pick<
  UserProfile,
  "id" | "username" | "displayName" | "avatarUrl" | "points" | "onboardingCompleted" | "feedVisibility" | "role"
>;

export function toShellProfile(profile: ShellProfile): ShellProfile;
export function toShellProfile(profile: ShellProfile | null | undefined): ShellProfile | undefined;
export function toShellProfile(profile: ShellProfile | null | undefined): ShellProfile | undefined {
  if (!profile) return undefined;
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    points: profile.points,
    onboardingCompleted: profile.onboardingCompleted,
    feedVisibility: profile.feedVisibility,
    role: profile.role,
  };
}

/** Test hook: empties every isolate cache in this module. */
export function __clearServerCachesForTests(): void {
  authUserCache.clear();
  userProfileCache.clear();
  bareProfileCache.clear();
}

/**
 * Per-request memoized Community lookup by ID or Slug.
 * Deduplicates identical queries between generateMetadata and Page components.
 */
export const getCachedCommunity = cache(async (idOrSlug: string) => {
  if (!idOrSlug) return null;
  const db = getDb();
  return await db.query.communities.findFirst({
    where: or(eq(communities.id, idOrSlug), eq(communities.slug, idOrSlug)),
    with: {
      members: {
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              points: true,
              isCollegeVerified: true,
              branch: true,
              year: true,
            },
          },
        },
      },
      creator: {
        columns: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });
});

/**
 * Per-request memoized Institution lookup by ID or Slug.
 * Deduplicates identical queries between generateMetadata and Page components.
 */
export const getCachedInstitution = cache(async (idOrSlug: string) => {
  if (!idOrSlug) return null;
  const db = getDb();
  const exact = await db.query.institutions.findFirst({
    where: or(eq(institutions.slug, idOrSlug), eq(institutions.id, idOrSlug)),
    with: {
      profiles: true,
      domains: true,
    },
  });
  if (exact) return exact;

  const cleanSlug = idOrSlug.toLowerCase().trim();
  return await db.query.institutions.findFirst({
    where: or(
      ilike(institutions.slug, cleanSlug),
      ilike(institutions.slug, `%${cleanSlug}%`),
      ilike(institutions.name, `%${cleanSlug}%`)
    ),
    with: {
      profiles: true,
      domains: true,
    },
  });
});

/**
 * Per-request memoized Post Detail lookup.
 * Deduplicates identical queries between generateMetadata and PostDetailPage.
 */
export const getCachedPostDetail = cache(async (id: string) => {
  if (!id) return null;
  const db = getDb();
  return await db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: {
      author: true,
      institution: true,
      votes: true,
      comments: {
        with: {
          author: true,
        },
      },
      pollOptions: {
        with: {
          votes: true,
        },
      },
    },
  });
});

/**
 * Per-request memoized Comment Detail lookup with Author, Institution, Post, and Replies.
 * Deduplicates identical queries between generateMetadata and CommentPermalinkPage.
 */
export const getCachedCommentDetail = cache(async (commentId: string) => {
  if (!commentId) return null;
  const db = getDb();
  return await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    with: {
      author: {
        with: {
          institution: true,
        },
      },
      post: {
        with: {
          author: true,
          institution: true,
          comments: {
            columns: {
              id: true,
            },
          },
        },
      },
      replies: {
        where: eq(comments.status, "PUBLISHED"),
        orderBy: [asc(comments.createdAt)],
        with: {
          author: {
            with: {
              institution: true,
            },
          },
        },
      },
    },
  });
});

