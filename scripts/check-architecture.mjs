#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "src");
const fullScan = process.argv.includes("--full");

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (/\.(?:ts|tsx|mts|cts)$/.test(entry.name) && !/\.d\.(?:ts|mts|cts)$/.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

function changedPaths() {
  const explicitBase = process.env.ARCHITECTURE_BASE_SHA;
  const baseRef = explicitBase || "HEAD^";
  const changed = new Set([
    ...git(["diff", "--name-only", "--diff-filter=ACMR", baseRef + "...HEAD"]),
    ...git(["diff", "--name-only", "--diff-filter=ACMR"]),
    ...git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
    ...git(["ls-files", "--others", "--exclude-standard"]),
  ]);
  return [...changed]
    .filter((file) => /\.(?:ts|tsx|mts|cts)$/.test(file) && !/\.d\.(?:ts|mts|cts)$/.test(file))
    .map((file) => path.resolve(ROOT, file))
    .filter((file) => file.startsWith(SOURCE_ROOT + path.sep));
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function isDatabaseInfrastructure(file) {
  return file === "src/db/index.ts" || file.startsWith("src/db/schema/");
}

function isRepository(file) {
  return /^src\/server\/features\/.+\.repository\.ts$/.test(file);
}

function isAppEntry(file) {
  return /^src\/app\/.+\/(?:page|layout|route|actions)\.tsx?$/.test(file)
    || /^src\/app\/(?:page|layout|route|actions)\.tsx?$/.test(file);
}

function inspectSource(file, source) {
  const violations = [];
  if (isDatabaseInfrastructure(file) || isRepository(file)) {
    if (isRepository(file) && /(?:from\s*|import\s*)["'](?:react|next\/(?:navigation|server))["']/.test(source)) {
      violations.push("repository modules must not import React or Next.js navigation/HTTP APIs");
    }
    return violations;
  }

  const databaseImport = /(?:from\s*|import\s*)["'](?:@\/db(?:\/schema(?:\/[^"']*)?)?|drizzle-orm(?:\/[^"']*)?)["']/g;
  if (databaseImport.test(source)) {
    violations.push("direct database/Drizzle import outside src/db/** or *.repository.ts");
  }

  if (/\bgetDb\s*\(|\bdb\.(?:query|select|insert|update|delete|execute)\s*(?:[.(]|\b)/.test(source)) {
    violations.push("direct database query outside src/db/** or *.repository.ts");
  }

  const isClient = /^\s*["']use client["'];?/m.test(source);
  if (isClient && /(?:from\s*|import\s*)["'](?:@\/server(?:\/[^"']*)?|@\/db(?:\/[^"']*)?|@\/hexclave\/server)["']/.test(source)) {
    violations.push("client module imports a server-only module");
  }

  if (isAppEntry(file) && /(?:from\s*|import\s*)["'](?:@\/db(?:\/[^"']*)?|drizzle-orm(?:\/[^"']*)?)["']/.test(source)) {
    violations.push("App Router entry points must delegate database access to server services");
  }

  return violations;
}

const files = fullScan
  ? (await walk(SOURCE_ROOT)).map((file) => path.resolve(file))
  : changedPaths();

if (files.length === 0) {
  console.log("Architecture check passed: no changed TypeScript source files to inspect.");
  process.exit(0);
}

const findings = [];
for (const absolute of [...new Set(files)].sort()) {
  let source;
  try {
    source = await readFile(absolute, "utf8");
  } catch {
    continue;
  }
  const file = relative(absolute);
  for (const reason of inspectSource(file, source)) findings.push({ file, reason });
}

const mode = fullScan ? "full source scan" : "changed-file scan";
if (findings.length > 0) {
  console.error("Architecture check failed (" + mode + "): " + findings.length + " violation(s) in " + new Set(findings.map((item) => item.file)).size + " file(s).");
  for (const finding of findings) console.error("  " + finding.file + ": " + finding.reason);
  if (!fullScan) console.error("\nUse bun run check:architecture:full to inspect existing violations across src/.");
  process.exit(1);
}

console.log("Architecture check passed (" + mode + "): inspected " + files.length + " TypeScript file(s).");
