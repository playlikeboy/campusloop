import { createClient } from "@sanity/client";
import { campusSeedData } from "./campus-data";

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

  if (!projectId || !token) {
    console.error("\n❌ Missing required environment variables:");
    console.error("  - NEXT_PUBLIC_SANITY_PROJECT_ID");
    console.error("  - SANITY_API_WRITE_TOKEN (generate with Write permissions in manage.sanity.io)");
    console.log("\nAlternatively, you can import the pre-built NDJSON dataset directly using the Sanity CLI:");
    console.log("  npx sanity@latest dataset import ./sanity/seed/campus-seed.ndjson production --replace\n");
    process.exit(1);
  }

  console.log(`🚀 Seeding CampusLoop Atlas data to Sanity [${projectId}:${dataset}]...`);

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2024-03-01",
    token,
    useCdn: false,
  });

  const transaction = client.transaction();
  for (const doc of campusSeedData) {
    transaction.createOrReplace(doc);
  }

  const result = await transaction.commit();
  console.log(`✅ Successfully seeded ${result.results.length} documents into Sanity dataset!`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
