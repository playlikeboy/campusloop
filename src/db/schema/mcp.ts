import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { userProfiles } from "./users";

export const userMcpKeys = pgTable(
  "user_mcp_keys",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    name: text("name").default("Default IDE Key").notNull(),
    key: text("key").notNull(),
    permissions: jsonb("permissions")
      .$type<string[]>()
      .default(sql`'["read", "write", "chat", "exclusive"]'::jsonb`)
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    requestsCount: integer("requests_count").default(0).notNull(),
    rateLimitPerMinute: integer("rate_limit_per_minute").default(120).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("user_mcp_keys_key_idx").on(table.key),
    index("user_mcp_keys_user_idx").on(table.userId),
  ]
);

export const mcpAuditLogs = pgTable(
  "mcp_audit_logs",
  {
    id: id(),
    keyId: text("key_id").references(() => userMcpKeys.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(),
    status: text("status").notNull(), // 'SUCCESS', 'ERROR', 'BLOCKED'
    latencyMs: integer("latency_ms"),
    clientInfo: text("client_info"),
    errorSummary: text("error_summary"),
    createdAt,
  },
  (table) => [
    index("mcp_audit_logs_user_created_idx").on(table.userId, table.createdAt),
    index("mcp_audit_logs_key_idx").on(table.keyId),
  ]
);

export type UserMcpKey = typeof userMcpKeys.$inferSelect;
export type NewUserMcpKey = typeof userMcpKeys.$inferInsert;
export type McpAuditLog = typeof mcpAuditLogs.$inferSelect;
export type NewMcpAuditLog = typeof mcpAuditLogs.$inferInsert;
