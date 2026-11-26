import { describe, expect, it } from "vitest";
import {
  articleRedirectTarget,
  articleRobots,
  authorPagePath,
  clampDescription,
  isArticleIndexable,
  parsePageParam,
  splitAfterSecondSection,
} from "./seo";

describe("seo_status and redirect mapping", () => {
  it("index articles allow large image previews", () => {
    const robots = articleRobots("index") as Record<string, unknown>;
    expect(robots.index).toBe(true);
    expect(robots["max-image-preview"]).toBe("large");
  });

  it("noindex articles keep follow", () => {
    expect(articleRobots("noindex")).toMatchObject({ index: false, follow: true });
  });

  it("a missing seo_status counts as index", () => {
    expect((articleRobots(undefined) as { index: boolean }).index).toBe(true);
  });

  it("redirect_to_slug maps to a target, ignoring blanks and self-loops", () => {
    expect(articleRedirectTarget({ slug: "a", status: "PUBLISHED", redirectToSlug: "b" })).toBe("b");
    expect(articleRedirectTarget({ slug: "a", status: "PUBLISHED", redirectToSlug: " " })).toBeNull();
    expect(articleRedirectTarget({ slug: "a", status: "PUBLISHED", redirectToSlug: "a" })).toBeNull();
  });

  it("only published, index, unredirected articles are indexable", () => {
    expect(isArticleIndexable({ slug: "a", status: "PUBLISHED", seoStatus: "index" })).toBe(true);
    expect(isArticleIndexable({ slug: "a", status: "PUBLISHED", seoStatus: "noindex" })).toBe(false);
    expect(isArticleIndexable({ slug: "a", status: "DRAFT", seoStatus: "index" })).toBe(false);
    expect(isArticleIndexable({ slug: "a", status: "PUBLISHED", redirectToSlug: "b" })).toBe(false);
  });
});

describe("clampDescription", () => {
  it("leaves short text alone", () => {
    expect(clampDescription("Short and sweet.")).toBe("Short and sweet.");
  });

  it("cuts long text on a word boundary within 155 characters", () => {
    const long = "word ".repeat(30) + "averyveryverylongwordattheend and more text after it to go well past the limit";
    const out = clampDescription(long);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith("…")).toBe(true);
    expect(out.slice(0, -1)).not.toMatch(/\s$/);
    expect(long.startsWith(out.slice(0, -1))).toBe(true);
  });

  it("drops the trailing ... that createExcerpt adds", () => {
    expect(clampDescription("A short excerpt...")).toBe("A short excerpt");
  });
});

describe("splitAfterSecondSection", () => {
  it("splits before the third h2 and ignores fenced headings", () => {
    const md = "intro\n## One\na\n```\n## not a heading\n```\n## Two\nb\n## Three\nc";
    const parts = splitAfterSecondSection(md);
    expect(parts?.[0]).toContain("## Two");
    expect(parts?.[1].startsWith("## Three")).toBe(true);
  });

  it("returns null with fewer than three h2s", () => {
    expect(splitAfterSecondSection("## One\n## Two\n")).toBeNull();
  });
});

describe("pagination params", () => {
  it("accepts integers from 2", () => {
    expect(parsePageParam("2")).toBe(2);
    expect(parsePageParam("1")).toBeNull();
    expect(parsePageParam("abc")).toBeNull();
    expect(parsePageParam("-3")).toBeNull();
  });

  it("author pages canonicalise like category pages", () => {
    expect(authorPagePath("asha")).toBe("/authors/asha");
    expect(authorPagePath("asha", 2)).toBe("/authors/asha/page/2");
  });
});
