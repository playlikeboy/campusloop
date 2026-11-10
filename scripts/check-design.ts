#!/usr/bin/env bun
/**
 * Design-system guard (docs/DESIGN_SYSTEM.md).
 * Everywhere in src/ it reports: gradient text, transition-all, decorative
 * backdrop blur, thick coloured side stripes, and the retired Plus Jakarta face.
 * Outside src/styles and src/components/ui it also reports: hex colours,
 * arbitrary colour classes (-[#…]), raw Tailwind palette classes, rounded-[Npx],
 * inline style colours, emoji in markup, and font imports other than the four
 * the system allows. `// ds-allow: <reason>` on the same or previous line
 * exempts one line. `--strict` exits 1 on any violation; default only reports.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const STRICT = process.argv.includes("--strict");
const JSON_OUT = process.argv.includes("--json");

const EXEMPT_DIRS = [join(SRC, "styles"), join(SRC, "components", "ui")];
// Email HTML, external-platform brand marks and the XSL stylesheet cannot read CSS variables.
const EXEMPT_FILES = new Set<string>([
  "src/app/globals.css",
  "src/app/sitemap.xsl/route.ts",
  "src/lib/social-links.ts",
  "src/lib/email-templates.ts",
  "src/app/api/admin/outreach/send/route.ts",
]);

const PALETTE =
  "(?:zinc|slate|gray|neutral|stone|rose|pink|fuchsia|violet|indigo|emerald|amber|orange|sky|blue|purple|red|green|yellow|lime|teal|cyan)";
type Rule = { id: string; re: RegExp; note: string; everywhere?: boolean; tsxOnly?: boolean };
const RULES: Rule[] = [
  { id: "hex", re: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/g, note: "hex colour; use a token" },
  { id: "arbitrary-colour", re: /-\[#[0-9a-fA-F]{3,8}\]/g, note: "arbitrary colour class; use a semantic utility" },
  {
    id: "raw-palette",
    re: new RegExp(
      `(?:^|[\\s"'\`:(])(?:[a-z-]+:)*(?:bg|text|border|ring|from|to|via|fill|stroke|shadow|outline|divide|decoration|placeholder|caret|accent)-${PALETTE}-(?:50|[1-9]00|950)(?:\\/\\d+)?(?=[\\s"'\`)]|$)`,
      "g"
    ),
    note: "raw palette class; map to bg-surface / text-fg / border-border / brand / crush / status",
  },
  { id: "transition-all", re: /\btransition-all\b/g, note: "transition-all animates layout; use transition-ui or transition-colors", everywhere: true },
  {
    id: "gradient-text",
    re: /\bbg-clip-text\b|background-clip:\s*text|-webkit-background-clip:\s*text/g,
    note: "gradient text; emphasis comes from weight or size",
    everywhere: true,
  },
  { id: "glass", re: /\bbackdrop-blur(?:-[a-z0-9]+|-\[[^\]]+\])?\b/g, note: "decorative blur; use a solid surface", everywhere: true },
  {
    id: "side-stripe",
    re: /\bborder-[lrse]-(?:[2-8]|\[\d+px\])(?=[\s"'`]|$)/g,
    note: "thick coloured side stripe on a card/alert; use a full hairline border or a tinted surface",
    everywhere: true,
  },
  { id: "retired-font", re: /Plus[_ ]Jakarta/g, note: "Plus Jakarta Sans is retired; use font-display / font-sans", everywhere: true },
  {
    id: "emoji",
    re: /\p{Extended_Pictographic}/gu,
    note: "emoji/unicode as an icon or decoration; use lucide-react (user content is fine: ds-allow it)",
    tsxOnly: true,
  },
  { id: "rounded-px", re: /rounded(?:-[a-z]+)?-\[\d+px\]/g, note: "pixel radius; use rounded-sm/md/lg/xl/full" },
  { id: "inline-colour", re: /style=\{\{[^}]*(?:color|background|borderColor|fill|stroke)\s*:\s*["'`]?#/g, note: "inline colour; use a token" },
  { id: "font-import", re: /from\s+["']next\/font\/google["']/g, note: "font import outside layout.tsx" },
];
const ALLOWED_FONTS = /Bricolage_Grotesque|Figtree|Noto_Sans_Devanagari|JetBrains_Mono/;

// Neutral thread/timeline rules are fine; only coloured stripes are slop.
const COLOURED_BORDER = new RegExp(
  `border-(?:primary|brand|crush|reward|success|danger|warning|verified|accent|destructive|${PALETTE})\\b`
);

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (/\.(tsx|ts|css)$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

type Finding = { file: string; line: number; rule: string; text: string; note: string };
const findings: Finding[] = [];
const allowed: Finding[] = [];
const perRule = new Map<string, number>();

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  const inSystem = EXEMPT_DIRS.some((d) => file.startsWith(d + "/")) || EXEMPT_FILES.has(rel);
  const isTsx = file.endsWith(".tsx");
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const prev = i > 0 ? lines[i - 1] : "";
    const isAllowed = /ds-allow:/.test(line) || /^\s*(?:\/\/|\{\/\*|\/\*)\s*ds-allow:/.test(prev);
    for (const rule of RULES) {
      if (inSystem && !rule.everywhere) continue;
      if (rule.tsxOnly && !isTsx) continue;
      if (/^\s*(?:\/\/|\*|\/\*)/.test(line) && rule.id !== "retired-font") continue;
      rule.re.lastIndex = 0;
      const m = rule.re.exec(line);
      if (!m) continue;
      if (rule.id === "font-import" && (rel === "src/app/layout.tsx" || ALLOWED_FONTS.test(line))) continue;
      if (rule.id === "hex" && /ds-token|oklch|currentColor/.test(line)) continue;
      if (rule.id === "side-stripe" && !COLOURED_BORDER.test(line)) continue;
      const f: Finding = { file: rel, line: i + 1, rule: rule.id, text: line.trim().slice(0, 140), note: rule.note };
      if (isAllowed) allowed.push(f);
      else {
        findings.push(f);
        perRule.set(rule.id, (perRule.get(rule.id) ?? 0) + 1);
      }
    }
  });
}

const byFile = new Map<string, number>();
for (const f of findings) byFile.set(f.file, (byFile.get(f.file) ?? 0) + 1);
const worst = [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);

if (JSON_OUT) {
  console.log(JSON.stringify({ total: findings.length, allowed: allowed.length, perRule: Object.fromEntries(perRule), worst, findings }, null, 2));
} else {
  console.log(`check:design — ${findings.length} violation(s), ${allowed.length} allowed via ds-allow\n`);
  for (const [rule, n] of [...perRule.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${rule.padEnd(18)} ${n}`);
  if (worst.length) {
    console.log("\nworst files:");
    for (const [file, n] of worst) console.log(`  ${String(n).padStart(4)}  ${file}`);
  }
  if (process.argv.includes("--list")) {
    console.log("");
    for (const f of findings) console.log(`${f.file}:${f.line}  [${f.rule}]  ${f.text}`);
  }
}

if (STRICT && findings.length > 0) process.exit(1);
