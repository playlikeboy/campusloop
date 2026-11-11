/**
 * Apply a drizzle/manual/*.sql file one statement at a time.
 *
 * Each statement is sent as its own query, outside any transaction, so
 * `CREATE INDEX CONCURRENTLY` works. For index statements the script checks
 * pg_indexes first and reports whether the index already existed.
 *
 * Usage:
 *   bun run scripts/db/apply-manual.ts drizzle/manual/0011_hot_path_indexes.sql [--dry-run]
 *
 * --dry-run  only report which indexes exist; send no DDL.
 */
import { readFileSync } from "node:fs";

import { neon } from "@neondatabase/serverless";

import { loadLocalEnv } from "../../src/lib/load-env";

/** Strip `--` line comments and split on `;` / `--> statement-breakpoint`. */
function splitStatements(source: string): string[] {
  const withoutComments = source
    .split("\n")
    .filter((line) => !line.trim().startsWith("--") || line.includes("statement-breakpoint"))
    .join("\n")
    .replace(/-->\s*statement-breakpoint/g, ";");
  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function indexName(stmt: string): string | null {
  const m = stmt.match(
    /create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?"?([A-Za-z0-9_]+)"?/i
  );
  return m ? m[1] : null;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("Usage: bun run scripts/db/apply-manual.ts <file.sql> [--dry-run]");
    process.exit(1);
  }

  loadLocalEnv();
  const url = process.env.DATABASE_URL ?? process.env.DB_URL;
  if (!url) {
    console.error("DATABASE_URL (or DB_URL) is not set.");
    process.exit(1);
  }
  const sql = neon(url);

  const statements = splitStatements(readFileSync(file, "utf8"));
  console.log(`${file}: ${statements.length} statement(s)${dryRun ? " [dry run]" : ""}`);

  let failures = 0;
  for (const [i, stmt] of statements.entries()) {
    const name = indexName(stmt);
    const label = name ?? stmt.split("\n")[0].slice(0, 80);

    let exists = false;
    let invalid = false;
    if (name) {
      // A failed CONCURRENTLY build leaves an INVALID index behind that
      // IF NOT EXISTS would silently skip; surface it so it can be dropped.
      const rows = (await sql.query(
        `select ix.indisvalid as valid
           from pg_indexes pi
           join pg_class c on c.relname = pi.indexname
           join pg_namespace n on n.oid = c.relnamespace and n.nspname = pi.schemaname
           join pg_index ix on ix.indexrelid = c.oid
          where pi.indexname = $1`,
        [name]
      )) as { valid: boolean }[];
      exists = rows.length > 0;
      invalid = rows.some((r) => !r.valid);
    }
    const state = name ? (exists ? (invalid ? "exists (INVALID: drop and re-run)" : "exists") : "creating") : "statement";
    console.log(`[${i + 1}/${statements.length}] ${label}: ${dryRun && state === "creating" ? "missing" : state}`);

    if (dryRun || exists) continue;

    const started = performance.now();
    try {
      await sql.query(stmt);
      console.log(`    done in ${((performance.now() - started) / 1000).toFixed(2)}s`);
    } catch (err) {
      failures++;
      console.error(`    FAILED after ${((performance.now() - started) / 1000).toFixed(2)}s:`, err);
    }
  }

  if (failures > 0) {
    console.error(`${failures} statement(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
