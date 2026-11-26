import { describe, expect, it } from "vitest";
import { categoryPagePath } from "@/lib/articles/seo";
import { articleSitemapEntries } from "./article-sitemap";
import { buildMetadata } from "./index";
import { articleJsonLd } from "./json-ld";

describe("articleJsonLd", () => {
  const base = {
    headline: "Binary search in 10 minutes",
    path: "/articles/binary-search",
    datePublished: "2026-10-28T00:00:00.000Z",
    authorName: "Asha",
    authorPath: "/authors/asha",
  };

  it("adds image, section, word count, keywords and free access", () => {
    const ld = articleJsonLd({
      ...base,
      image: "https://campusloop.space/og?title=Binary",
      articleSection: "Data Structures & Algorithms",
      wordCount: 1320,
      keywords: ["#dsa", "binary-search", ""],
    });
    expect(ld.image).toEqual(["https://campusloop.space/og?title=Binary"]);
    expect(ld.articleSection).toBe("Data Structures & Algorithms");
    expect(ld.wordCount).toBe(1320);
    expect(ld.keywords).toBe("dsa, binary-search");
    expect(ld.isAccessibleForFree).toBe(true);
    expect(ld.author).toEqual({ "@type": "Person", name: "Asha", url: "https://campusloop.space/authors/asha" });
  });

  it("credits an Organization for the editorial byline", () => {
    const ld = articleJsonLd({
      ...base,
      authorName: "CampusLoop Editorial",
      authorPath: "/authors/campusloop-editorial",
      authorType: "Organization",
    });
    expect((ld.author as { "@type": string })["@type"]).toBe("Organization");
    expect((ld.author as { url: string }).url).toBe("https://campusloop.space/authors/campusloop-editorial");
  });

  it("drops empty optional fields", () => {
    const ld = articleJsonLd({ ...base, keywords: [], wordCount: 0 });
    expect(ld).not.toHaveProperty("keywords");
    expect(ld).not.toHaveProperty("wordCount");
    expect(ld).not.toHaveProperty("image");
  });
});

describe("category pagination canonical", () => {
  it("page 1 is the bare hub, later pages canonicalise to themselves", () => {
    expect(categoryPagePath("dsa")).toBe("/articles/category/dsa");
    expect(categoryPagePath("dsa", 1)).toBe("/articles/category/dsa");
    const meta = buildMetadata({ title: "DSA (page 3)", description: "x", path: categoryPagePath("dsa", 3) });
    expect(meta.alternates?.canonical).toBe("https://campusloop.space/articles/category/dsa/page/3");
  });

  it("buildMetadata takes a robots override", () => {
    const meta = buildMetadata({
      title: "T",
      description: "d",
      path: "/x",
      robots: { index: false, follow: true },
    });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});

describe("articleSitemapEntries", () => {
  const rows = [
    { slug: "good", title: "Good", status: "PUBLISHED", seoStatus: "index", coverImageUrl: "https://cdn.x/c.png" },
    { slug: "thin", title: "Thin", status: "PUBLISHED", seoStatus: "noindex" },
    { slug: "dupe", title: "Dupe", status: "PUBLISHED", seoStatus: "index", redirectToSlug: "good" },
    { slug: "draft", title: "Draft", status: "DRAFT", seoStatus: "index" },
  ];

  it("excludes noindex, redirected and unpublished articles", () => {
    const paths = articleSitemapEntries(rows, { categories: [], authors: [] }).map((e) => e.path);
    expect(paths).toEqual(["/articles/good"]);
  });

  it("adds image entries, category hubs and author pages", () => {
    const entries = articleSitemapEntries(rows, {
      categories: [{ category: "DSA" }, { category: "NOT_A_CATEGORY" }],
      authors: [{ username: "asha" }, { username: "campusloop-editorial" }],
      editorialLastmod: null,
    });
    expect(entries.find((e) => e.path === "/articles/good")?.images).toEqual([
      { loc: "https://cdn.x/c.png", title: "Good" },
    ]);
    const paths = entries.map((e) => e.path);
    expect(paths).toContain("/articles/category/dsa");
    expect(paths).toContain("/authors/asha");
    expect(paths.filter((p) => p === "/authors/campusloop-editorial")).toHaveLength(1);
    expect(paths.some((p) => p.includes("not-a-category"))).toBe(false);
  });
});
