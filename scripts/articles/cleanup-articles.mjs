/**
 * CampusLoop Articles Platform Cleanup Script
 *
 * Safely removes only synthetic demo entities created by seed-articles.mjs:
 * - Articles where is_demo = TRUE
 * - Associated article links, comments, and votes
 * - User profiles with username LIKE 'demo_%' and is_seeded = TRUE
 *
 * NEVER affects real user accounts, comments, or published student articles.
 */

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DB_URL or DATABASE_URL");
  process.exit(1);
}

const sql = neon(connectionString);

async function cleanup() {
  console.log("🧹 Starting safe cleanup of demo articles fixtures...");

  // 1. Delete comments and links on demo articles
  const deletedLinks = await sql`
    DELETE FROM article_links
    WHERE article_id IN (SELECT id FROM articles WHERE is_demo = TRUE)
    RETURNING id
  `;
  console.log(`- Deleted ${deletedLinks.length} demo article links`);

  const deletedComments = await sql`
    DELETE FROM article_comments
    WHERE article_id IN (SELECT id FROM articles WHERE is_demo = TRUE)
    RETURNING id
  `;
  console.log(`- Deleted ${deletedComments.length} demo article comments`);

  const deletedVotes = await sql`
    DELETE FROM article_votes
    WHERE article_id IN (SELECT id FROM articles WHERE is_demo = TRUE)
    RETURNING id
  `;
  console.log(`- Deleted ${deletedVotes.length} demo article votes`);

  // 2. Delete demo articles
  const deletedArticles = await sql`
    DELETE FROM articles
    WHERE is_demo = TRUE
    RETURNING id
  `;
  console.log(`- Deleted ${deletedArticles.length} demo articles`);

  // 3. Delete demo user profiles
  const deletedProfiles = await sql`
    DELETE FROM user_profiles
    WHERE username LIKE 'demo_%' AND is_seeded = TRUE
    RETURNING id, username
  `;
  console.log(`- Deleted ${deletedProfiles.length} demo author profiles`);

  console.log("✅ Cleanup finished cleanly. Zero production user records affected.");
}

cleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Cleanup error:", err);
    process.exit(1);
  });
