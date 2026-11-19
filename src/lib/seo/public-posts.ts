import { and, eq, isNull, notInArray, notLike, sql } from "drizzle-orm";
import { externalPosts, posts } from "@/db/schema";

/**
 * WHERE clause for posts that may be shown to search engines and RSS readers.
 * Use with `.leftJoin(externalPosts, eq(externalPosts.postId, posts.id))`.
 *
 * Excludes anonymous posts and confessions (hidden from public profiles),
 * seeded demo posts, and imported Reddit/RSS mirrors (not canonical here).
 */
export function indexablePostsWhere() {
  return and(
    eq(posts.status, "PUBLISHED"),
    eq(posts.isAnonymous, false),
    notInArray(posts.type, ["ANONYMOUS", "CONFESSION"]),
    eq(posts.isSeeded, false),
    // Matches the post page: one-word posts ("Hello", "Test") are noindex there.
    sql`char_length(${posts.body}) >= 40`,
    notLike(posts.id, "seed\\_202609\\_%"),
    isNull(externalPosts.id)
  );
}
