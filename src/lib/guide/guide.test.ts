import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DOCS_FEATURES } from "@/lib/docs-features";
import { GUIDE_CATEGORIES, GUIDES } from "./index";
import { buildLlmsFullTxt, buildLlmsTxt } from "./llms";

/** All App Router page paths, with route groups like (main) stripped. */
function appPagePaths(dir = join(process.cwd(), "src/app"), base = ""): Set<string> {
  const out = new Set<string>();
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) {
      if (name === "page.tsx") out.add(base || "/");
      continue;
    }
    const seg = /^\(.*\)$/.test(name) ? "" : `/${name}`;
    for (const p of appPagePaths(full, base + seg)) out.add(p);
  }
  return out;
}

describe("product guide catalogue", () => {
  const slugs = new Set(GUIDES.map((g) => g.slug));

  it("has unique, URL-safe slugs", () => {
    expect(slugs.size).toBe(GUIDES.length);
    for (const g of GUIDES) expect(g.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("fills every required section", () => {
    for (const g of GUIDES) {
      expect(g.summary.length, g.slug).toBeGreaterThan(20);
      expect(g.purpose.length, g.slug).toBeGreaterThan(20);
      expect(g.whyUse.length, g.slug).toBeGreaterThan(0);
      expect(g.howToUse.length, g.slug).toBeGreaterThan(1);
      expect(g.useCases.length, g.slug).toBeGreaterThan(0);
      expect(g.faq.length, g.slug).toBeGreaterThan(0);
      expect(g.investorAngle.length, g.slug).toBeGreaterThan(20);
      expect(g.updated, g.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("only links to guides and essays that exist", () => {
    const essays = new Set(DOCS_FEATURES.map((f) => f.slug));
    for (const g of GUIDES) {
      for (const r of g.related) expect(slugs.has(r), `${g.slug} -> ${r}`).toBe(true);
      if (g.essaySlug) expect(essays.has(g.essaySlug), `${g.slug} essay ${g.essaySlug}`).toBe(true);
    }
  });

  it("uses every category", () => {
    for (const c of GUIDE_CATEGORIES) expect(GUIDES.some((g) => g.category === c.name), c.name).toBe(true);
  });

  it("points at app routes that exist", () => {
    const pages = appPagePaths();
    const normalize = (p: string) => p.replace(/\[[^\]]+\]/g, "[x]");
    const known = new Set([...pages].map(normalize));
    for (const g of GUIDES) {
      for (const r of g.routes) {
        // Concrete paths like /posts/POLL map onto dynamic segments.
        const candidates = [normalize(r.path), normalize(r.path.replace(/\/[^/]+$/, "/[x]"))];
        const ok = r.path === "/merchant-portal" || candidates.some((c) => known.has(c));
        expect(ok, `${g.slug}: ${r.path}`).toBe(true);
      }
    }
  });

  it("generates llms files covering every guide", () => {
    const index = buildLlmsTxt();
    const full = buildLlmsFullTxt();
    for (const g of GUIDES) {
      expect(index).toContain(`/guide/${g.slug}`);
      expect(full).toContain(`URL: https://campusloop.space/guide/${g.slug}`);
    }
  });
});
