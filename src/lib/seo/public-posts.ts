import { and, eq, isNull, notInArray, notLike } from "drizzle-orm";
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
    notLike(posts.id, "seed\\_202609\\_%"),
    isNull(externalPosts.id)
  );
}
