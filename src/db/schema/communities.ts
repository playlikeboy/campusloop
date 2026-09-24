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
    privacy: text("privacy").default("PUBLIC").notNull(),
    category: text("category").default("General").notNull(),
    rules: text("rules"),
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
    index("communities_privacy_created_idx").on(table.privacy, table.createdAt),
    index("communities_points_created_idx").on(table.points, table.createdAt),
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
    role: text("role").default("MEMBER").notNull(),
    status: text("status").default("ACTIVE").notNull(),
    createdAt,
  },
  (table) => [
    uniqueIndex("community_members_join_idx").on(table.communityId, table.userId),
    index("community_members_user_status_created_idx").on(
      table.userId,
      table.status,
      table.createdAt
    ),
    index("community_members_community_status_created_idx").on(
      table.communityId,
      table.status,
      table.createdAt
    ),
  ]
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
  (table) => [
    uniqueIndex("community_webhooks_token_idx").on(table.token),
  ]
);

export type Community = typeof communities.$inferSelect;
export type NewCommunity = typeof communities.$inferInsert;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type NewCommunityMember = typeof communityMembers.$inferInsert;
export type CommunityWebhook = typeof communityWebhooks.$inferSelect;
export type NewCommunityWebhook = typeof communityWebhooks.$inferInsert;
