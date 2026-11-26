import { describe, expect, it } from "vitest";
import { ARTICLE_CATEGORY_LIST } from "@/constants/articles";
import { CATEGORY_INTROS } from "./category-intros";

describe("category intros", () => {
  it("every category has a unique 80 to 120 word intro", () => {
    const seen = new Set<string>();
    for (const c of ARTICLE_CATEGORY_LIST) {
      const intro = CATEGORY_INTROS[c.key];
      const words = intro.split(/\s+/).filter(Boolean).length;
      expect(words, c.key).toBeGreaterThanOrEqual(80);
      expect(words, c.key).toBeLessThanOrEqual(120);
      expect(seen.has(intro)).toBe(false);
      seen.add(intro);
    }
  });

  it("avoids filler words", () => {
    const banned = /\b(delve|unlock|elevate|seamless|leverage|comprehensive|landscape|journey|empower|realm)\b/i;
    for (const c of ARTICLE_CATEGORY_LIST) expect(CATEGORY_INTROS[c.key], c.key).not.toMatch(banned);
  });
});
