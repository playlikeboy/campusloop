import { eq, ilike, or } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { communities, institutions, posts, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { getCommunitySummary } from "@/lib/communities/queries";

/**
 * Per-request memoized current user from Hexclave auth.
 */
export const getCachedAuthUser = cache(async () => {
  return await hexclaveServerApp.getUser();
});

/**
 * Per-request memoized User Profile with Institution relation.
 */
export const getCachedUserProfile = cache(async (userId: string) => {
  if (!userId) return null;
  const db = getDb();
  return await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
    with: {
      institution: true,
    },
  });
});

/**
 * Lightweight community lookup for routes that only need identity, stats, and creator.
 * It deliberately avoids hydrating every member row.
 */
export const getCachedCommunitySummary = cache(async (idOrSlug: string) => {
  return getCommunitySummary(idOrSlug);
});

/**
 * Full community lookup for the members/settings surfaces that actually need member rows.
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
 */
export const getCachedInstitution = cache(async (idOrSlug: string) => {
  if (!idOrSlug) return null;
  const db = getDb();
  const exact = await db.query.institutions.findFirst({
    where: or(eq(institutions.slug, idOrSlug), eq(institutions.id, idOrSlug)),
    with: {
      profiles: true,
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
    },
  });
});

/**
 * Per-request memoized Post Detail lookup.
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
