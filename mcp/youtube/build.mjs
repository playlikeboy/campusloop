// Bundles src/*.gs into dist/Code.gs so the whole server can be pasted into
// a single Apps Script file. Run: node mcp/youtube/build.mjs
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = dirname(fileURLToPath(import.meta.url));
const srcDir = join(root, "src");
const files = readdirSync(srcDir)
  .filter((f) => f.endsWith(".gs"))
  .sort();

const parts = files.map((f) => {
  const body = readFileSync(join(srcDir, f), "utf8").trimEnd();
  return f === files[0] ? body : `/* ===== ${f} ===== */\n\n${body}`;
});
const output = `${parts.join("\n\n")}\n`;

// Fail the build on syntax errors (Apps Script V8 runs plain scripts, not modules).
new vm.Script(output, { filename: "Code.gs" });

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "Code.gs"), output);
console.log(`dist/Code.gs: ${files.length} files, ${output.split("\n").length} lines, ${(output.length / 1024).toFixed(1)} KB`);
