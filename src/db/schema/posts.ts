import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { contentStatusEnum, createdAt, id, updatedAt } from "./common";
import { institutions } from "./institutions";
import { userProfiles } from "./users";

export const postTypeEnum = pgEnum("post_type", [
  "NORMAL",
  "ANONYMOUS",
  "CONFESSION",
  "POLL",
  "QUESTION",
  "MEME",
  "EVENT",
  "LOST_FOUND",
]);

export const postScopeEnum = pgEnum("post_scope", ["CAMPUS", "STATE", "INDIA", "GLOBAL"]);

export const posts = pgTable(
  "posts",
  {
    id: id(),
    authorId: text("author_id").references(() => userProfiles.id, { onDelete: "cascade" }),
    pseudonym: text("pseudonym"),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    type: postTypeEnum("type").default("NORMAL").notNull(),
    scope: postScopeEnum("scope").default("CAMPUS").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    isEdited: boolean("is_edited").default(false).notNull(),
    repostOfId: text("repost_of_id").references((): AnyPgColumn => posts.id, { onDelete: "cascade" }),
    repostComment: text("repost_comment"),
    status: contentStatusEnum("status").default("PUBLISHED").notNull(),
    riskScore: integer("risk_score").default(0).notNull(),
    communityId: text("community_id"),
    isSeeded: boolean("is_seeded").default(false).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("posts_institution_status_created_idx").on(table.institutionId, table.status, table.createdAt),
    index("posts_scope_status_created_idx").on(table.scope, table.status, table.createdAt),
    index("posts_author_created_idx").on(table.authorId, table.createdAt),
    index("posts_type_status_created_idx").on(table.type, table.status, table.createdAt),
    index("posts_community_status_created_idx").on(table.communityId, table.status, table.createdAt),
    index("posts_repost_idx").on(table.repostOfId),
    index("posts_is_seeded_idx").on(table.isSeeded, table.status, table.createdAt),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: id(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => userProfiles.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
    replyToUserId: text("reply_to_user_id").references((): AnyPgColumn => userProfiles.id, { onDelete: "set null" }),
    pseudonym: text("pseudonym"),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    likesCount: integer("likes_count").default(0).notNull(),
    repliesCount: integer("replies_count").default(0).notNull(),
    status: contentStatusEnum("status").default("PUBLISHED").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("comments_post_created_idx").on(table.postId, table.createdAt),
    index("comments_parent_created_idx").on(table.parentId, table.createdAt),
    index("comments_author_idx").on(table.authorId),
    index("comments_post_pinned_idx").on(table.postId, table.isPinned),
  ]
);

export const pollOptions = pgTable(
  "poll_options",
  {
    id: id(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt,
  },
  (table) => [index("poll_options_post_idx").on(table.postId)]
);

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: id(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    optionId: text("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    createdAt,
  },
  (table) => [
    uniqueIndex("poll_votes_user_post_idx").on(table.userId, table.postId),
    index("poll_votes_option_idx").on(table.optionId),
  ]
);

export const votes = pgTable(
  "votes",
  {
    id: id(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt,
  },
  (table) => [
    uniqueIndex("votes_user_post_idx").on(table.userId, table.postId),
    index("votes_post_idx").on(table.postId),
  ]
);

export const commentVotes = pgTable(
  "comment_votes",
  {
    id: id(),
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    value: integer("value").default(1).notNull(),
    createdAt,
  },
  (table) => [
    uniqueIndex("comment_votes_user_comment_idx").on(table.userId, table.commentId),
    index("comment_votes_comment_idx").on(table.commentId),
    index("comment_votes_user_idx").on(table.userId),
  ]
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type CommentVote = typeof commentVotes.$inferSelect;
export type NewCommentVote = typeof commentVotes.$inferInsert;
