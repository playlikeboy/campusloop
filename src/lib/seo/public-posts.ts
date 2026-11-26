import { and, eq, isNull, notInArray, notLike, sql } from "drizzle-orm";
import { externalPosts, posts } from "@/db/schema";
import { communityPostVisibleSql } from "@/lib/post-visibility";

/**
 * WHERE clause for posts that may be shown to search engines and RSS readers.
 * Use with `.leftJoin(externalPosts, eq(externalPosts.postId, posts.id))`.
 *
 * Excludes anonymous posts and confessions (hidden from public profiles),
 * seeded demo posts, imported Reddit/RSS mirrors (not canonical here), and
 * posts in private or unlisted communities (members-only content).
 */
export function indexablePostsWhere() {
  return and(
    eq(posts.status, "PUBLISHED"),
    eq(posts.isAnonymous, false),
    notInArray(posts.type, ["ANONYMOUS", "CONFESSION"]),
    eq(posts.isSeeded, false),
    communityPostVisibleSql(null),
    // Matches the post page: one-word posts ("Hello", "Test") are noindex there.
    sql`char_length(${posts.body}) >= 40`,
    notLike(posts.id, "seed\\_202609\\_%"),
    isNull(externalPosts.id)
  );
}
