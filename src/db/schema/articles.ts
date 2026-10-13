import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { institutions } from "./institutions";
import { userProfiles } from "./users";

export const articleStatusEnum = ["PUBLISHED", "DRAFT", "ARCHIVED"] as const;

export const articleCategoryEnum = [
  // Legacy / existing categories
  "GENERAL",
  "TECH_AND_CODE",
  "PLACEMENTS",
  "CAMPUS_LIFE",
  "RESEARCH",
  "INTERNSHIPS",
  "PROJECTS",
  "GUIDES",
  "OPINION",

  // Phase 2: Technology and Development
  "TECH_AND_PROGRAMMING",
  "AI_AND_ML",
  "WEB_DEVELOPMENT",
  "MOBILE_DEV",
  "DATA_SCIENCE",
  "CYBERSECURITY",
  "CLOUD_AND_DEVOPS",
  "OPEN_SOURCE",
  "ROBOTICS",
  "PRODUCT_DEV",

  // Phase 2: Academics and Career
  "ACADEMICS",
  "DSA",
  "JOBS_AND_CAREER",
  "FELLOWSHIPS",
  "HACKATHONS",
  "INTERVIEW_PREP",
  "CAREER_ADVICE",
  "SCHOLARSHIPS",
  "SCIENCE_AND_RESEARCH",
  "STARTUPS",

  // Phase 2: Lifestyle and Community
  "HOSTEL_LIFE",
  "CLUBS",
  "EVENTS_OPPORTUNITIES",
  "GAMING",
  "MEMES",
  "ENTERTAINMENT",
  "MUSIC_AND_ARTS",
  "DESIGN",
  "BOOKS",
  "SPORTS_AND_FITNESS",
  "HEALTH",
  "FINANCE",
  "PRODUCTIVITY",
  "TRAVEL",
  "FOOD",
  "RELATIONSHIPS",
  "SUSTAINABILITY",
  "SHOWCASES",
] as const;

export const articles = pgTable(
  "articles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").unique().notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    excerpt: text("excerpt"),
    content: text("content").notNull(), // Markdown or rich HTML content
    coverImageUrl: text("cover_image_url"),
    authorId: text("author_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    institutionId: text("institution_id").references(() => institutions.id, { onDelete: "set null" }),
    category: varchar("category", { length: 64 }).default("GENERAL").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    readingTimeMinutes: integer("reading_time_minutes").default(3).notNull(),
    viewsCount: integer("views_count").default(0).notNull(),
    upvotesCount: integer("upvotes_count").default(0).notNull(),
    downvotesCount: integer("downvotes_count").default(0).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isDemo: boolean("is_demo").default(false).notNull(),
    status: varchar("status", { length: 16 }).default("PUBLISHED").notNull(),
    publishedAt: timestamp("published_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("articles_category_idx").on(table.category),
    index("articles_status_idx").on(table.status),
    index("articles_is_demo_idx").on(table.isDemo),
    index("articles_author_idx").on(table.authorId),
    index("articles_institution_idx").on(table.institutionId),
    index("articles_published_at_idx").on(table.publishedAt),
    index("articles_created_at_idx").on(table.createdAt),
  ]
);

export const articleCategories = pgTable(
  "article_categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").unique().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"),
    group: varchar("group", { length: 32 }).default("GENERAL").notNull(), // TECHNOLOGY, ACADEMICS, LIFESTYLE, GENERAL
    sortOrder: integer("sort_order").default(0).notNull(),
    isOfficial: boolean("is_official").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("article_categories_slug_idx").on(table.slug),
    index("article_categories_group_idx").on(table.group),
    index("article_categories_sort_order_idx").on(table.sortOrder),
  ]
);

export const articleTags = pgTable(
  "article_tags",
  {
    id: text("id").primaryKey(),
    slug: text("slug").unique().notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("article_tags_slug_idx").on(table.slug)]
);

export const articleToTags = pgTable(
  "article_to_tags",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => articleTags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("article_to_tags_article_tag_idx").on(table.articleId, table.tagId)]
);

export const articleLinks = pgTable(
  "article_links",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    type: varchar("type", { length: 32 }).default("REFERENCE").notNull(), // GITHUB, DOCS, DEMO, REFERENCE, PAPER, RESOURCE
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("article_links_article_idx").on(table.articleId),
    index("article_links_order_idx").on(table.displayOrder),
  ]
);

export const articleVotes = pgTable(
  "article_votes",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    value: integer("value").notNull(), // 1 for upvote, -1 for downvote
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("article_votes_profile_article_idx").on(t.profileId, t.articleId)]
);

export const savedArticles = pgTable(
  "saved_articles",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("saved_articles_profile_article_idx").on(t.profileId, t.articleId)]
);

export const articleComments = pgTable(
  "article_comments",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    parentId: text("parent_id"), // For threaded nested replies
    body: text("body").notNull(),
    upvotesCount: integer("upvotes_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("article_comments_article_idx").on(table.articleId),
    index("article_comments_author_idx").on(table.authorId),
    index("article_comments_parent_idx").on(table.parentId),
  ]
);

export const articleCommentVotes = pgTable(
  "article_comment_votes",
  {
    id: text("id").primaryKey(),
    commentId: text("comment_id")
      .notNull()
      .references(() => articleComments.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("article_comment_votes_profile_comment_idx").on(table.profileId, table.commentId),
  ]
);

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type ArticleCategory = typeof articleCategories.$inferSelect;
export type NewArticleCategory = typeof articleCategories.$inferInsert;
export type ArticleTag = typeof articleTags.$inferSelect;
export type NewArticleTag = typeof articleTags.$inferInsert;
export type ArticleLink = typeof articleLinks.$inferSelect;
export type NewArticleLink = typeof articleLinks.$inferInsert;
export type ArticleVote = typeof articleVotes.$inferSelect;
export type NewArticleVote = typeof articleVotes.$inferInsert;
export type SavedArticle = typeof savedArticles.$inferSelect;
export type NewSavedArticle = typeof savedArticles.$inferInsert;
export type ArticleComment = typeof articleComments.$inferSelect;
export type NewArticleComment = typeof articleComments.$inferInsert;
export type ArticleCommentVote = typeof articleCommentVotes.$inferSelect;
export type NewArticleCommentVote = typeof articleCommentVotes.$inferInsert;
