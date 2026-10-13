import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DB_URL or DATABASE_URL");
  process.exit(1);
}

const sql = neon(connectionString);

async function migrate() {
  console.log("Applying Articles schema updates to Neon PostgreSQL...");

  // 1. Ensure columns on articles table
  await sql`
    ALTER TABLE articles 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
  `;
  await sql`
    ALTER TABLE articles 
    ALTER COLUMN category TYPE VARCHAR(64);
  `;

  // 2. Create article_categories table
  await sql`
    CREATE TABLE IF NOT EXISTS article_categories (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      "group" VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_official BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS article_categories_slug_idx ON article_categories (slug);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS article_categories_group_idx ON article_categories ("group");
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS article_categories_sort_order_idx ON article_categories (sort_order);
  `;

  // 3. Create article_tags table
  await sql`
    CREATE TABLE IF NOT EXISTS article_tags (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS article_tags_slug_idx ON article_tags (slug);
  `;

  // 4. Create article_to_tags junction table
  await sql`
    CREATE TABLE IF NOT EXISTS article_to_tags (
      article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES article_tags(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (article_id, tag_id)
    );
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS article_to_tags_article_tag_idx ON article_to_tags (article_id, tag_id);
  `;

  // 5. Create article_links table
  await sql`
    CREATE TABLE IF NOT EXISTS article_links (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      type VARCHAR(32) NOT NULL DEFAULT 'REFERENCE',
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS article_links_article_idx ON article_links (article_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS article_links_order_idx ON article_links (display_order);
  `;

  // 6. Extra indexes on articles
  await sql`
    CREATE INDEX IF NOT EXISTS articles_category_idx ON articles (category);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS articles_status_idx ON articles (status);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS articles_is_demo_idx ON articles (is_demo);
  `;

  console.log("Articles schema updates applied successfully!");
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
