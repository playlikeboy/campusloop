import { createHash } from "node:crypto";
import { inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { institutionDomains, institutions } from "../src/db/schema";
import { loadLocalEnv } from "../src/lib/load-env";
import {
  VERIFIED_STUDENT_EMAIL_DOMAINS,
  INSTITUTION_EMAIL_FORMATS,
} from "../src/lib/student-email-domains";

loadLocalEnv();

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

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function main() {
  console.log("Starting CampusLoop Student Email Domains & Subdomain Synchronization...");
  const client = postgres(requireDatabaseUrl(), { max: 1, prepare: false });
  const db = drizzle(client);

  console.log("1. Fetching institutions from Neon PostgreSQL...");
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
  console.log(`Found ${allInstitutions.length} institutions in database.`);

  console.log("2. Fetching existing domain records from institution_domains...");
  const existingDomainsList = await db
    .select({
      id: institutionDomains.id,
      domain: institutionDomains.domain,
      domainType: institutionDomains.domainType,
      verificationStatus: institutionDomains.verificationStatus,
    })
    .from(institutionDomains);

  const existingDomainMap = new Map<string, (typeof existingDomainsList)[0]>();
  for (const row of existingDomainsList) {
    existingDomainMap.set(row.domain.toLowerCase().trim(), row);
  }
  console.log(`Found ${existingDomainsList.length} existing domains in database.`);

  console.log("3. Mapping curated student email domains & branch subdomains...");
  const domainsToInsert: (typeof institutionDomains.$inferInsert)[] = [];
  const idsToUpgrade: string[] = [];

  for (const [slug, domains] of Object.entries(VERIFIED_STUDENT_EMAIL_DOMAINS)) {
    const inst = instBySlug.get(slug.toLowerCase());
    if (!inst) {
      console.warn(`[WARN] Institution with slug '${slug}' not found in database.`);
      continue;
    }

    for (const rawDomain of domains) {
      const cleanDomain = rawDomain.trim().toLowerCase().replace(/^@/, "");
      if (!cleanDomain) continue;

      const existing = existingDomainMap.get(cleanDomain);
      if (!existing) {
        domainsToInsert.push({
          id: stableId("domain", `${inst.id}_${cleanDomain}`),
          institutionId: inst.id,
          domain: cleanDomain,
          domainType: "STUDENT_EMAIL",
          verificationStatus: "ADMIN_VERIFIED",
        });
        existingDomainMap.set(cleanDomain, {
          id: stableId("domain", `${inst.id}_${cleanDomain}`),
          domain: cleanDomain,
          domainType: "STUDENT_EMAIL",
          verificationStatus: "ADMIN_VERIFIED",
        });
      } else if (
        existing.domainType !== "STUDENT_EMAIL" ||
        existing.verificationStatus !== "ADMIN_VERIFIED"
      ) {
        idsToUpgrade.push(existing.id);
      }
    }
  }

  if (idsToUpgrade.length > 0) {
    console.log(`Upgrading ${idsToUpgrade.length} existing domains to STUDENT_EMAIL & ADMIN_VERIFIED in batches...`);
    for (const batch of chunk(idsToUpgrade, 50)) {
      await db
        .update(institutionDomains)
        .set({
          domainType: "STUDENT_EMAIL",
          verificationStatus: "ADMIN_VERIFIED",
          updatedAt: new Date(),
        })
        .where(inArray(institutionDomains.id, batch));
    }
  }

  if (domainsToInsert.length > 0) {
    console.log(`Inserting ${domainsToInsert.length} new verified student email domains in batches...`);
    for (const batch of chunk(domainsToInsert, 50)) {
      await db.insert(institutionDomains).values(batch).onConflictDoNothing();
    }
  }

  // Verify IIT ISM Dhanbad
  const ismInst = instBySlug.get("iitism");
  if (ismInst) {
    const ismDomainsInDb = await db
      .select({
        domain: institutionDomains.domain,
        domainType: institutionDomains.domainType,
        verificationStatus: institutionDomains.verificationStatus,
      })
      .from(institutionDomains)
      .where(sql`${institutionDomains.institutionId} = ${ismInst.id}`);

    console.log(`\n=== Verification for IIT (ISM) Dhanbad (${ismInst.name}) ===`);
    console.log(`Total domains configured: ${ismDomainsInDb.length}`);
    const ismFormat = INSTITUTION_EMAIL_FORMATS.iitism;
    if (ismFormat) {
      console.log(`Pattern: ${ismFormat.pattern}`);
      console.log(`Example: ${ismFormat.example}`);
      console.log(`ID Type: ${ismFormat.idType}`);
    }
    console.log("Subdomains list:");
    console.log(ismDomainsInDb.map((d) => `  @${d.domain} [${d.domainType} - ${d.verificationStatus}]`).join("\n"));
  }

  const [totalInsts] = await db.select({ count: sql`count(*)` }).from(institutions);
  const [totalDoms] = await db.select({ count: sql`count(*)` }).from(institutionDomains);
  console.log("\n=== Synchronization Summary ===");
  console.log(`Total institutions: ${totalInsts.count}`);
  console.log(`Total registered domains: ${totalDoms.count}`);
  console.log(`New domains inserted: ${domainsToInsert.length}`);
  console.log(`Domains promoted: ${idsToUpgrade.length}`);

  await client.end();
  console.log("Database sync completed successfully!");
}

main().catch((err) => {
  console.error("Fatal error during sync:", err);
  process.exit(1);
});
