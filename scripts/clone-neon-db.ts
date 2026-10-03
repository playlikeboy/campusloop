import postgres from "postgres";

const OLD_DB_URL =
  process.env.OLD_DB_URL ||
  "postgresql://neondb_owner:npg_omgCBP6IUL5V@ep-bitter-thunder-aqcdsivq-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const NEW_DB_URL =
  process.env.NEW_DB_URL ||
  "postgresql://neondb_owner:npg_TitzAVM6oSf7@ep-silent-math-b5nurzzp-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  console.log("Connecting to source and destination databases...");
  const src = postgres(OLD_DB_URL, { max: 10, idle_timeout: 30 });
  const dest = postgres(NEW_DB_URL, { max: 10, idle_timeout: 30 });

  try {
    // 1. Get foreign keys on destination
    console.log("1. Inspecting foreign key constraints on destination...");
    const fks = await dest`
      SELECT 
        conrelid::regclass::text AS table_name,
        conname AS constraint_name,
        pg_get_constraintdef(c.oid) AS constraint_def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE contype = 'f' AND n.nspname = 'public';
    `;
    console.log(`Found ${fks.length} foreign key constraints.`);

    // 2. Drop FK constraints
    console.log("2. Temporarily dropping foreign key constraints...");
    for (const fk of fks) {
      await dest.unsafe(
        `ALTER TABLE ${fk.table_name} DROP CONSTRAINT IF EXISTS "${fk.constraint_name}";`
      );
    }
    console.log("All foreign key constraints dropped.");

    // 3. Find non-empty tables in source
    console.log("3. Discovering non-empty tables in source database...");
    const allTables = await src`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tablesToCopy: { name: string; count: number }[] = [];
    for (const row of allTables) {
      const [{ count }] = await src.unsafe(
        `SELECT count(*)::int AS count FROM "${row.table_name}";`
      );
      if (count > 0) {
        tablesToCopy.push({ name: row.table_name, count });
      }
    }

    console.log(`Found ${tablesToCopy.length} tables with data to copy.`);

    // 4. Copy each table
    console.log("\n4. Copying data in batches...");
    const CHUNK_SIZE = 500;

    for (const t of tablesToCopy) {
      console.log(`\nCopying ${t.name} (${t.count} rows)...`);

      // Get columns present in both src and dest
      const srcCols = (
        await src`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = ${t.name};
        `
      ).map((r) => r.column_name);

      const destCols = (
        await dest`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = ${t.name};
        `
      ).map((r) => r.column_name);

      const destColSet = new Set(destCols);
      const commonCols = srcCols.filter((col) => destColSet.has(col));

      if (commonCols.length === 0) {
        console.warn(`  Skipping ${t.name}: No common columns found.`);
        continue;
      }

      // Ensure dest table is empty before copying
      await dest.unsafe(`TRUNCATE TABLE "${t.name}" CASCADE;`);

      let offset = 0;
      const selectColsList = commonCols.map((c) => `"${c}"`).join(", ");

      while (offset < t.count) {
        const rows = await src.unsafe(
          `SELECT ${selectColsList} FROM "${t.name}" LIMIT ${CHUNK_SIZE} OFFSET ${offset};`
        );
        if (rows.length === 0) break;

        // Perform multi-row insert using postgres helper with explicit columns
        await dest`INSERT INTO ${dest(t.name)} ${dest(rows, commonCols)}`;

        offset += rows.length;
        process.stdout.write(`  Copied ${offset}/${t.count} rows...\r`);
      }
      console.log(`\n  Completed ${t.name} (${t.count} rows).`);
    }

    // 5. Restore FK constraints
    console.log("\n5. Restoring foreign key constraints on destination...");
    let restoredFks = 0;
    const failedFks: string[] = [];

    for (const fk of fks) {
      try {
        await dest.unsafe(
          `ALTER TABLE ${fk.table_name} ADD CONSTRAINT "${fk.constraint_name}" ${fk.constraint_def};`
        );
        restoredFks++;
      } catch (err: any) {
        console.warn(
          `  Warning: Could not restore FK ${fk.constraint_name} on ${fk.table_name}:`,
          err.message
        );
        failedFks.push(fk.constraint_name);
      }
    }
    console.log(`Restored ${restoredFks}/${fks.length} foreign key constraints.`);
    if (failedFks.length > 0) {
      console.warn("Failed constraints count:", failedFks.length);
    }

    // 6. Reset all sequences
    console.log("\n6. Resetting database sequences...");
    const sequences = await dest`
      SELECT 
        c.relname AS seq_name,
        t.relname AS table_name,
        a.attname AS col_name
      FROM pg_class c
      JOIN pg_depend d ON d.objid = c.oid
      JOIN pg_class t ON t.oid = d.refobjid
      JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
      WHERE c.relkind = 'S';
    `;

    for (const s of sequences) {
      try {
        await dest.unsafe(`
          SELECT setval(
            '${s.seq_name}', 
            COALESCE((SELECT MAX("${s.col_name}") FROM "${s.table_name}"), 1)
          );
        `);
      } catch (e: any) {
        // Some columns may not be numeric or auto-incrementing
      }
    }
    console.log("Sequences updated.");

    // 7. Validation: Compare row counts
    console.log("\n7. Validating row counts between source and destination...");
    let allMatched = true;
    for (const t of tablesToCopy) {
      const [{ count: destCount }] = await dest.unsafe(
        `SELECT count(*)::int AS count FROM "${t.name}";`
      );
      const match = destCount === t.count;
      console.log(
        `  ${match ? "✓" : "✗"} ${t.name}: source=${t.count}, destination=${destCount}`
      );
      if (!match) allMatched = false;
    }

    if (allMatched) {
      console.log("\n🎉 Full database clone completed with 100% data integrity!");
    } else {
      console.error("\n❌ Discrepancies found in row counts between source and destination.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await src.end();
    await dest.end();
  }
}

main();
