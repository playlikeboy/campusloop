import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { userProfiles } from "./users";

/**
 * "Login with CampusLoop": CampusLoop as an OpenID Connect provider.
 * Secrets, codes and refresh tokens are stored only as SHA-256 hashes.
 * See src/lib/oauth/ and docs at /developers.
 */
export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: text("id").primaryKey(), // client_id, "cl_app_..."
    ownerProfileId: text("owner_profile_id").references(() => userProfiles.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    logoUrl: text("logo_url"),
    homepageUrl: text("homepage_url"),
    privacyUrl: text("privacy_url"),
    termsUrl: text("terms_url"),
    redirectUris: jsonb("redirect_uris").$type<string[]>().default([]).notNull(),
    type: text("type").default("CONFIDENTIAL").notNull(), // CONFIDENTIAL | PUBLIC
    clientSecretHash: text("client_secret_hash"),
    secretLast4: text("secret_last4"),
    requestedScopes: jsonb("requested_scopes").$type<string[]>().default([]).notNull(),
    approvedScopes: jsonb("approved_scopes").$type<string[]>().default([]).notNull(), // sensitive scopes an admin approved
    reviewStatus: text("review_status").default("NONE").notNull(), // NONE | PENDING | APPROVED | REJECTED
    reviewNote: text("review_note"),
    isFirstParty: boolean("is_first_party").default(false).notNull(),
    sector: text("sector"), // shared pairwise-sub sector, e.g. "campusloop" for ecosystem apps
    status: text("status").default("ACTIVE").notNull(), // ACTIVE | SUSPENDED
    usersCount: integer("users_count").default(0).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("oauth_clients_owner_idx").on(t.ownerProfileId), index("oauth_clients_review_idx").on(t.reviewStatus)]
);

export const oauthCodes = pgTable(
  "oauth_codes",
  {
    codeHash: text("code_hash").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    redirectUri: text("redirect_uri").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    codeChallenge: text("code_challenge"),
    nonce: text("nonce"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [index("oauth_codes_expires_idx").on(t.expiresAt)]
);

export const oauthGrants = pgTable(
  "oauth_grants",
  {
    id: id(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex("oauth_grants_unique").on(t.clientId, t.profileId), index("oauth_grants_profile_idx").on(t.profileId)]
);

export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    familyId: text("family_id").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [index("oauth_refresh_family_idx").on(t.familyId), index("oauth_refresh_grant_idx").on(t.clientId, t.profileId)]
);

export type OauthClient = typeof oauthClients.$inferSelect;
export type OauthGrant = typeof oauthGrants.$inferSelect;
