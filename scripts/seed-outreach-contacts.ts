import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { outreachContacts, userProfiles } from "../src/db/schema";
import { loadLocalEnv } from "../src/lib/load-env";

loadLocalEnv();

type OutreachCsvRow = {
  Name?: string;
  Email?: string;
  College_Name?: string;
  College_Slug?: string;
  Role?: string;
  Notes?: string;
  Source?: string;
};

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.DB_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL. Set DATABASE_URL or DB_URL before running.");
  }
  return databaseUrl;
}

function stableId(prefix: string, value: string) {
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 24);
  return `${prefix}_${hash}`;
}

async function main() {
  const client = postgres(requireDatabaseUrl(), { max: 1, prepare: false });
  const db = drizzle(client);

  console.log("1. Ensuring outreach_contacts table exists in database...");
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS outreach_contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      college_name TEXT NOT NULL,
      college_slug TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Campus Representative',
      status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      source TEXT DEFAULT 'public_directory',
      sent_at TIMESTAMP WITH TIME ZONE,
      opened_at TIMESTAMP WITH TIME ZONE,
      replied_at TIMESTAMP WITH TIME ZONE,
      last_error TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS outreach_contacts_college_idx ON outreach_contacts (college_slug);
    CREATE INDEX IF NOT EXISTS outreach_contacts_status_idx ON outreach_contacts (status);
    CREATE INDEX IF NOT EXISTS outreach_contacts_sent_at_idx ON outreach_contacts (sent_at);
  `);

  console.log("2. Ensuring is_college_verified column exists on user_profiles...");
  await client.unsafe(`
    ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS is_college_verified BOOLEAN NOT NULL DEFAULT FALSE;

    CREATE INDEX IF NOT EXISTS user_profiles_college_verified_idx ON user_profiles (is_college_verified);
  `);

  // Backfill is_college_verified for users who have a college email (not gmail/yahoo/etc) and have an accredited institution
  console.log("3. Backfilling is_college_verified for existing college email users...");
  await client.unsafe(`
    UPDATE user_profiles
    SET is_college_verified = TRUE
    WHERE is_college_verified = FALSE
      AND email IS NOT NULL
      AND email NOT ILIKE '%@gmail.com'
      AND email NOT ILIKE '%@yahoo.com'
      AND email NOT ILIKE '%@outlook.com'
      AND email NOT ILIKE '%@hotmail.com'
      AND email NOT ILIKE '%@icloud.com'
      AND email NOT ILIKE '%@protonmail.com'
      AND email NOT ILIKE '%@zoho.com'
      AND institution_id NOT IN (
        SELECT id FROM institutions WHERE slug = 'viewer-hub'
      );
  `);

  console.log("4. Reading college-outreach-contacts.csv...");
  const csvPath = path.join(process.cwd(), "src/lib/college-outreach-contacts.csv");
  const csv = await readFile(csvPath, "utf8");
  const rows = parse(csv, {
    bom: true,
    columns: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  }) as OutreachCsvRow[];

  let insertedCount = 0;
  for (const row of rows) {
    const email = row.Email?.trim().toLowerCase();
    const name = row.Name?.trim();
    const collegeName = row.College_Name?.trim();
    const collegeSlug = (row.College_Slug?.trim() || "").toLowerCase();
    const role = row.Role?.trim() || "Campus Representative";
    const notes = row.Notes?.trim() || null;
    const source = row.Source?.trim() || "public_directory";

    if (!email || !name || !collegeName || !collegeSlug) continue;

    const contactId = stableId("outreach", email);

    await db
      .insert(outreachContacts)
      .values({
        id: contactId,
        name,
        email,
        collegeName,
        collegeSlug,
        role,
        notes,
        source,
        status: "PENDING",
      })
      .onConflictDoNothing();
    insertedCount++;
  }

  const totalContacts = await db.select({ count: sql`count(*)` }).from(outreachContacts);
  console.log(`=== Outreach Seed Complete ===`);
  console.log(`Processed ${insertedCount} contacts from CSV.`);
  console.log(`Total outreach contacts in DB: ${totalContacts[0].count}`);

  await client.end();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error seeding outreach contacts:", err);
  process.exit(1);
});
