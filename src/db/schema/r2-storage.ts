import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const r2StorageObjects = pgTable("r2_storage_objects", {
  key: text("key").primaryKey(),
  contentType: text("content_type").notNull(),
  data: text("data").notNull(), // base64 encoded binary payload
  size: integer("size").notNull(),
  metadata: text("metadata"), // JSON metadata
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type R2StorageObject = typeof r2StorageObjects.$inferSelect;
export type NewR2StorageObject = typeof r2StorageObjects.$inferInsert;
