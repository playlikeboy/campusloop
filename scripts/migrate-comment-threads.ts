import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
if (!dbUrl) {
  console.error("DATABASE_URL or DB_URL is required");
  process.exit(1);
}

const sql = neon(dbUrl);

async function main() {
  console.log("Starting comment threads and votes migration...");

  // 1. Add columns to comments table
  console.log("Adding columns to comments table...");
  await sql`
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_to_user_id TEXT REFERENCES user_profiles(id) ON DELETE SET NULL;
  `;
  await sql`
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_url TEXT;
  `;
  await sql`
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
  `;
  await sql`
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;
  `;
  await sql`
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS replies_count INTEGER NOT NULL DEFAULT 0;
  `;

  // 2. Add pinned index
  console.log("Creating comments_post_pinned_idx index...");
  await sql`
    CREATE INDEX IF NOT EXISTS comments_post_pinned_idx ON comments (post_id, is_pinned);
  `;

  // 3. Create comment_votes table
  console.log("Creating comment_votes table...");
  await sql`
    CREATE TABLE IF NOT EXISTS comment_votes (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  // 4. Indexes for comment_votes
  console.log("Creating indexes on comment_votes...");
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS comment_votes_user_comment_idx ON comment_votes(user_id, comment_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS comment_votes_comment_idx ON comment_votes(comment_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS comment_votes_user_idx ON comment_votes(user_id);
  `;

  // 5. Backfill replies_count on existing comments
  console.log("Backfilling replies_count for existing comments...");
  const updatedReplies = await sql`
    UPDATE comments c
    SET replies_count = sub.count
    FROM (
      SELECT parent_id, COUNT(*)::int AS count
      FROM comments
      WHERE parent_id IS NOT NULL
      GROUP BY parent_id
    ) sub
    WHERE c.id = sub.parent_id
    RETURNING c.id;
  `;
  console.log(`Backfilled replies_count on ${updatedReplies.length} parent comments.`);

  console.log("Migration completed successfully! 🎉");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
