import { and, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { institutions, posts, userProfiles, votes } from "@/db/schema";
import { TASTE_QUIZ_SIZE } from "@/lib/growth/constants";

/** A real post shown in the onboarding taste swipe. */
export interface TastePost {
  id: string;
  body: string;
  type: string;
  /** Null for anonymous posts and confessions: the author is never shown. */
  authorName: string | null;
  campusName: string;
  upvotes: number;
}

const QUIZ_TYPES = ["NORMAL", "ANONYMOUS", "CONFESSION", "QUESTION", "MEME", "POLL"] as const;
const LOOKBACK_DAYS = 45;

function clip(text: string, max = 260): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/**
 * The most upvoted recent posts a new student can already see: their own
 * campus first, then posts shared beyond a campus. Seeded demo posts are
 * never used, and anonymous authors stay anonymous.
 */
export async function getTasteQuizPosts(institutionId: string | null, limit = TASTE_QUIZ_SIZE): Promise<TastePost[]> {
  const db = getDb();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const upvotes = sql<number>`(select count(*)::int from ${votes} where ${votes.postId} = ${posts.id} and ${votes.value} > 0)`;

  const base = and(
    eq(posts.status, "PUBLISHED"),
    eq(posts.isSeeded, false),
    isNull(posts.repostOfId),
    isNull(posts.communityId),
    inArray(posts.type, [...QUIZ_TYPES]),
    gte(posts.createdAt, since),
    sql`char_length(${posts.body}) between 20 and 2000`
  );

  const select = {
    id: posts.id,
    body: posts.body,
    type: posts.type,
    isAnonymous: posts.isAnonymous,
    authorName: userProfiles.displayName,
    campusName: institutions.name,
    upvotes,
  };

  const campusRows = institutionId
    ? await db
        .select(select)
        .from(posts)
        .innerJoin(institutions, eq(institutions.id, posts.institutionId))
        .leftJoin(userProfiles, eq(userProfiles.id, posts.authorId))
        .where(and(base, eq(posts.institutionId, institutionId)))
        .orderBy(desc(upvotes), desc(posts.createdAt))
        .limit(limit)
    : [];

  let rows = campusRows;
  if (rows.length < limit) {
    const wider = await db
      .select(select)
      .from(posts)
      .innerJoin(institutions, eq(institutions.id, posts.institutionId))
      .leftJoin(userProfiles, eq(userProfiles.id, posts.authorId))
      .where(
        and(
          base,
          ne(posts.scope, "CAMPUS"),
          institutionId ? ne(posts.institutionId, institutionId) : undefined
        )
      )
      .orderBy(desc(upvotes), desc(posts.createdAt))
      .limit(limit - rows.length);
    rows = [...rows, ...wider];
  }

  return rows.map((row) => {
    const anonymous = row.isAnonymous || row.type === "CONFESSION" || row.type === "ANONYMOUS";
    return {
      id: row.id,
      body: clip(row.body),
      type: row.type,
      authorName: anonymous ? null : (row.authorName ?? null),
      campusName: row.campusName.split(",")[0]?.trim() || row.campusName,
      upvotes: Number(row.upvotes) || 0,
    };
  });
}
