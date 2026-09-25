/**
 * CampusLoop Master Posts Catalog (Consolidated 300+ Posts)
 * Aggregates all feed, confession, question, poll, and community discussion items.
 */
import { FEED_POSTS, type RawPostItem } from "./posts-feed";
import { FEED_POSTS_BATCH_2 } from "./posts-feed-2";
import { FEED_POSTS_BATCH_3 } from "./posts-feed-3";
import { CONFESSIONS } from "./posts-confessions";
import { COMMUNITY_POSTS } from "./posts-communities";
import { COMMUNITY_POSTS_BATCH_2 } from "./posts-communities-2";

export const ALL_POSTS: RawPostItem[] = [
  ...FEED_POSTS,
  ...FEED_POSTS_BATCH_2,
  ...CONFESSIONS,
  ...COMMUNITY_POSTS,
  ...COMMUNITY_POSTS_BATCH_2,
  ...FEED_POSTS_BATCH_3,
];

export { RawPostItem };
