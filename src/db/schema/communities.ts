import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { userProfiles } from "./users";

export const communities = pgTable(
  "communities",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug"),
    description: text("description"),
    avatarUrl: text("avatar_url"),
    bannerUrl: text("banner_url"),
    privacy: text("privacy").default("PUBLIC").notNull(), // 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
    category: text("category").default("General").notNull(), // 'Tech & Coding' | 'Music & Arts' | 'Gaming & Anime' | etc.
    rules: text("rules"), // JSON stringified array of rules [{ title, description }]
    allowAnonymousPosts: boolean("allow_anonymous_posts").default(true).notNull(),
    points: integer("points").default(0).notNull(),
    inviteCode: text("invite_code"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("communities_name_idx").on(table.name),
    index("communities_creator_created_idx").on(table.creatorId, table.createdAt),
    index("communities_created_idx").on(table.createdAt),
  ]
);

export const communityMembers = pgTable(
  "community_members",
  {
    id: id(),
    communityId: text("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    role: text("role").default("MEMBER").notNull(), // 'ADMIN' | 'MODERATOR' | 'MEMBER'
    status: text("status").default("ACTIVE").notNull(), // 'ACTIVE' | 'PENDING' | 'BANNED'
    createdAt,
  },
  (table) => [uniqueIndex("community_members_join_idx").on(table.communityId, table.userId)]
);

export const communityWebhooks = pgTable(
  "community_webhooks",
  {
    id: id(),
    communityId: text("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    token: text("token").notNull(),
    botName: text("bot_name").default("CampusBot").notNull(),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    postsCount: integer("posts_count").default(0).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("community_webhooks_token_idx").on(table.token)]
);

export type Community = typeof communities.$inferSelect;
export type NewCommunity = typeof communities.$inferInsert;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type NewCommunityMember = typeof communityMembers.$inferInsert;
export type CommunityWebhook = typeof communityWebhooks.$inferSelect;
export type NewCommunityWebhook = typeof communityWebhooks.$inferInsert;
