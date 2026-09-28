import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
if (!dbUrl) {
  console.error("DATABASE_URL or DB_URL is required");
  process.exit(1);
}

const sql = neon(dbUrl);

async function main() {
  console.log("Running migration for saved_articles and article_votes...");

  // 1. Create saved_articles table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS saved_articles (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS saved_articles_profile_article_idx ON saved_articles(profile_id, article_id);
  `;

  // 2. Ensure unique index on article_votes
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS article_votes_profile_article_idx ON article_votes(profile_id, article_id);
  `;

  console.log("Articles database tables and indexes verified successfully!");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
