import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "tokens.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function collect(selector: string) {
  const map = new Map<string, string>();
  const re = new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    for (const decl of m[1].split(";")) {
      const [k, v] = decl.split(":").map((s) => s?.trim());
      if (k?.startsWith("--") && v) map.set(k, v);
    }
  }
  return map;
}

const light = collect(":root");
const dark = new Map([...light, ...collect(".dark")]);

function resolve(map: Map<string, string>, token: string, depth = 0): string {
  if (depth > 10) throw new Error(`cycle resolving ${token}`);
  const raw = map.get(token);
  if (!raw) throw new Error(`missing token ${token}`);
  const ref = raw.match(/var\((--[\w-]+)\)/);
  return ref ? resolve(map, ref[1], depth + 1) : raw;
}

function luminance(hex: string) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = Number.parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [foreground, background, minimum]. 4.5 = body text, 3 = large text / UI boundary.
const PAIRS: Array<[string, string, number]> = [
  ["--fg", "--bg", 4.5],
  ["--fg", "--surface", 4.5],
  ["--fg", "--surface-muted", 4.5],
  ["--fg-muted", "--bg", 4.5],
  ["--fg-muted", "--surface", 4.5],
  ["--fg-muted", "--surface-muted", 4.5],
  ["--fg-subtle", "--bg", 4.5],
  ["--fg-subtle", "--surface", 4.5],
  ["--fg-subtle", "--surface-muted", 4.5],
  ["--brand-fg", "--brand", 4.5],
  ["--brand-fg", "--brand-hover", 4.5],
  ["--brand-text", "--bg", 4.5],
  ["--brand-text", "--surface", 4.5],
  ["--brand-text", "--brand-subtle", 4.5],
  ["--reward-fg", "--reward", 4.5],
  ["--reward-text", "--bg", 4.5],
  ["--reward-text", "--reward-subtle", 4.5],
  ["--crush-fg", "--crush", 4.5],
  ["--crush-text", "--bg", 4.5],
  ["--crush-text", "--crush-subtle", 4.5],
  ["--success-fg", "--success", 4.5],
  ["--success", "--bg", 4.5],
  ["--success", "--success-subtle", 4.5],
  ["--danger-fg", "--danger", 4.5],
  ["--danger", "--bg", 4.5],
  ["--danger", "--danger-subtle", 4.5],
  ["--warning-fg", "--warning", 4.5],
  ["--warning", "--bg", 4.5],
  ["--warning", "--warning-subtle", 4.5],
  ["--ring", "--bg", 3],
  ["--ring", "--surface", 3],
  ["--brand", "--bg", 3],
  ["--border-strong", "--bg", 1.5],
];

for (const [name, map] of [
  ["light", light],
  ["dark", dark],
] as const) {
  describe(`contrast (${name})`, () => {
    for (const [fg, bg, min] of PAIRS) {
      it(`${fg} on ${bg} ≥ ${min}:1`, () => {
        const ratio = contrast(resolve(map, fg), resolve(map, bg));
        expect(ratio, `${fg}=${resolve(map, fg)} on ${bg}=${resolve(map, bg)} → ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
      });
    }
  });
}
