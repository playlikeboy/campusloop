import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DB_URL or DATABASE_URL");
  process.exit(1);
}

const sql = neon(connectionString);

async function main() {
  console.log("Renaming demo author accounts to loop_* in Neon PostgreSQL...");

  // Update user_profiles
  const updatedProfiles = await sql`
    UPDATE user_profiles
    SET
      username = REPLACE(username, 'demo_', 'loop_'),
      email = REPLACE(REPLACE(email, 'demo+', 'loop+'), '@campusloop.test', '@campusloop.space'),
      avatar_url = REPLACE(avatar_url, 'seed=demo_', 'seed=loop_'),
      updated_at = NOW()
    WHERE username LIKE 'demo_%'
    RETURNING id, username, email;
  `;

  console.log(`Updated ${updatedProfiles.length} user profiles:`);
  for (const u of updatedProfiles) {
    console.log(` - ${u.username} (${u.email})`);
  }

  console.log("\nDone! All demo accounts successfully renamed to loop_*.");
}

main().catch((err) => {
  console.error("Error renaming accounts:", err);
  process.exit(1);
});
