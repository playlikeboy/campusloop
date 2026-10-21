import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { institutionDomains, institutions, type NewInstitution } from "../src/db/schema";
import { loadLocalEnv } from "../src/lib/load-env";
import { VERIFIED_STUDENT_EMAIL_DOMAINS } from "../src/lib/student-email-domains";

loadLocalEnv();

type CollegeCsvRow = {
  Aishe_Code?: string;
  Name?: string;
  State?: string;
  District?: string;
  Website?: string;
  Year_Of_Establishment?: string;
  Location?: string;
  Slug?: string;
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

function normalizeDomain(website?: string | null) {
  const raw = website?.trim();
  if (!raw) return null;
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[/?#]/)[0]
    .replace(/\/+$/g, "")
    .trim()
    .toLowerCase() || null;
}

function parseYear(value?: string) {
  const year = Number.parseInt(value ?? "", 10);
  return Number.isFinite(year) ? year : null;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function main() {
  const client = postgres(requireDatabaseUrl(), { max: 1, prepare: false });
  const db = drizzle(client);

  console.log("1. Reading colleges.csv to sync institutions & website domains...");
  const csvPath = path.join(process.cwd(), "src/lib/colleges.csv");
  const csv = await readFile(csvPath, "utf8");
  const rows = parse(csv, {
    bom: true,
    columns: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  }) as CollegeCsvRow[];

  const institutionsToInsert: NewInstitution[] = [];
  const websiteDomainsToInsert: (typeof institutionDomains.$inferInsert)[] = [];

  for (const row of rows) {
    const aisheCode = row.Aishe_Code?.trim();
    const name = row.Name?.trim();
    const slug = (row.Slug?.trim() || "").toLowerCase();
    if (!aisheCode || !name || !slug) continue;

    const institutionId = stableId("inst", aisheCode);
    const website = row.Website?.trim() || null;
    const websiteDomain = normalizeDomain(website);

    institutionsToInsert.push({
      id: institutionId,
      aisheCode,
      name,
      slug,
      state: row.State?.trim() || null,
      district: row.District?.trim() || null,
      website,
      websiteDomain,
      yearOfEstablishment: parseYear(row.Year_Of_Establishment),
      locationType: row.Location?.trim() || null,
      country: "India",
      source: "colleges_csv",
    });

    if (websiteDomain) {
      websiteDomainsToInsert.push({
        id: stableId("domain", `${institutionId}_${websiteDomain}`),
        institutionId,
        domain: websiteDomain,
        domainType: "WEBSITE",
        verificationStatus: "AUTO_IMPORTED",
      });
    }
  }

  console.log(`Upserting ${institutionsToInsert.length} institutions from colleges.csv into DB...`);
  for (const batch of chunk(institutionsToInsert, 250)) {
    await db.insert(institutions).values(batch).onConflictDoNothing();
  }

  console.log(`Upserting ${websiteDomainsToInsert.length} website domains into DB...`);
  for (const batch of chunk(websiteDomainsToInsert, 250)) {
    await db.insert(institutionDomains).values(batch).onConflictDoNothing();
  }

  console.log("2. Fetching all institutions from DB for student domain mapping...");
  const allInstitutions = await db
    .select({
      id: institutions.id,
      slug: institutions.slug,
      name: institutions.name,
      websiteDomain: institutions.websiteDomain,
    })
    .from(institutions);

  const instBySlug = new Map<string, (typeof allInstitutions)[0]>();
  for (const inst of allInstitutions) {
    instBySlug.set(inst.slug.toLowerCase(), inst);
  }

  console.log("3. Mapping verified student email domains to institutions...");
  const existingDomainsList = await db.select({ domain: institutionDomains.domain }).from(institutionDomains);
  const existingDomainSet = new Set(existingDomainsList.map((d) => d.domain.toLowerCase().trim()));

  const studentDomainsToInsert: (typeof institutionDomains.$inferInsert)[] = [];

  for (const [slug, domains] of Object.entries(VERIFIED_STUDENT_EMAIL_DOMAINS)) {
    const inst = instBySlug.get(slug.toLowerCase());
    if (!inst) {
      console.warn(`[WARN] Institution with slug '${slug}' not found in database.`);
      continue;
    }

    for (const rawDomain of domains) {
      const cleanDomain = rawDomain.trim().toLowerCase().replace(/^@/, "");
      if (!cleanDomain) continue;

      if (!existingDomainSet.has(cleanDomain)) {
        const domainId = stableId("domain", `${inst.id}_${cleanDomain}`);
        const isWebsiteDomain = cleanDomain === inst.websiteDomain?.toLowerCase();
        const domainType = isWebsiteDomain ? "EMAIL" : "STUDENT_EMAIL";

        studentDomainsToInsert.push({
          id: domainId,
          institutionId: inst.id,
          domain: cleanDomain,
          domainType,
          verificationStatus: "ADMIN_VERIFIED",
        });
        existingDomainSet.add(cleanDomain);
      }
    }
  }

  if (studentDomainsToInsert.length > 0) {
    console.log(`Inserting ${studentDomainsToInsert.length} new student email domains into DB...`);
    for (const batch of chunk(studentDomainsToInsert, 50)) {
      await db.insert(institutionDomains).values(batch).onConflictDoNothing();
    }
  }

  const totalInsts = await db.select({ count: sql`count(*)` }).from(institutions);
  const totalDoms = await db.select({ count: sql`count(*)` }).from(institutionDomains);
  console.log(`=== DB Sync Complete ===`);
  console.log(`Total institutions in DB: ${totalInsts[0].count}`);
  console.log(`Total domains in DB: ${totalDoms[0].count}`);

  await client.end();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error running seed-student-domains:", err);
  process.exit(1);
});
