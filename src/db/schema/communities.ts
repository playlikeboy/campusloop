import { index, boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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

export type Community = typeof communities.$inferSelect;
export type NewCommunity = typeof communities.$inferInsert;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type NewCommunityMember = typeof communityMembers.$inferInsert;
export type CommunityWebhook = typeof communityWebhooks.$inferSelect;
export type NewCommunityWebhook = typeof communityWebhooks.$inferInsert;

