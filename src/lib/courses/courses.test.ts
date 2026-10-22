import { describe, expect, it } from "vitest";
import cs50 from "@/data/courses/cs50.json";
import { formatClock, formatDuration, parseVideoUrl, slugifyCourse } from "./format";
import { catalogHref, categoryFromSlug, categorySlug, isBrowseHome, pageWindow, parseCatalogParams } from "./catalog-params";
import { bayesianRating, shouldBeListed, trendScore } from "./promotion";
import { validateCourse } from "./validate";

describe("course formatting", () => {
  it("formats durations and clocks", () => {
    expect(formatDuration(5400)).toBe("1h 30m");
    expect(formatDuration(125)).toBe("2m");
    expect(formatClock(754)).toBe("12:34");
    expect(formatClock(3754)).toBe("1:02:34");
    expect(slugifyCourse("DSA in 8 Weeks: Placements!")).toBe("dsa-in-8-weeks-placements");
  });

  it("parses lecture video links", () => {
    expect(parseVideoUrl("https://youtu.be/2WtPyqwTLKM?t=30")).toEqual({ provider: "youtube", ref: "2WtPyqwTLKM" });
    expect(parseVideoUrl("https://www.youtube.com/watch?v=2WtPyqwTLKM")).toEqual({ provider: "youtube", ref: "2WtPyqwTLKM" });
    expect(parseVideoUrl("https://vimeo.com/76979871")).toEqual({ provider: "vimeo", ref: "76979871" });
    expect(parseVideoUrl("https://cdn.example.com/lecture.mp4")?.provider).toBe("file");
    expect(parseVideoUrl("javascript:alert(1)")).toBeNull();
    expect(parseVideoUrl("https://example.com/page")).toBeNull();
  });
});

describe("course validation", () => {
  const good = {
    title: "DSA in 8 weeks",
    subtitle: "A practical plan for placements",
    description: "x".repeat(120),
    outcomes: ["Arrays", "Graphs"],
    sections: [
      {
        title: "Basics",
        lectures: [
          { title: "Intro", kind: "VIDEO", videoUrl: "https://youtu.be/2WtPyqwTLKM" },
          { title: "Notes", kind: "ARTICLE", body: "Read this" },
          { title: "Sheet", kind: "LINK", videoUrl: "https://example.com/sheet" },
        ],
      },
    ],
  };

  it("accepts a complete course for publishing", () => {
    expect(validateCourse(good, "PUBLISHED").ok).toBe(true);
  });

  it("explains what is missing", () => {
    const r = validateCourse({ ...good, sections: [{ title: "", lectures: [{ title: "", kind: "VIDEO", videoUrl: "nope" }] }] }, "PUBLISHED");
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/Section 1: add a title/);
    expect(r.errors.join(" ")).toMatch(/YouTube, Vimeo or .mp4/);
  });

  it("drops non-https attachments and clamps fields", () => {
    const r = validateCourse({
      ...good,
      sections: [{ title: "S", lectures: [{ title: "L", kind: "LINK", videoUrl: "https://a.b/c", attachments: [{ label: "x", url: "javascript:1" }, { label: "ok", url: "https://a.b/d.pdf" }] }] }],
    });
    expect(r.value.sections[0].lectures[0].attachments).toEqual([{ label: "ok", url: "https://a.b/d.pdf" }]);
  });
});

describe("CS50 catalog data", () => {
  it("has courses with verified, well-formed lectures", () => {
    expect(cs50.courses.length).toBeGreaterThanOrEqual(10);
    for (const c of cs50.courses) {
      expect(c.lectures.length, c.key).toBeGreaterThan(0);
      for (const l of c.lectures) {
        expect(l.videoId).toMatch(/^[A-Za-z0-9_-]{11}$/);
        // Real lectures, not trailers.
        expect(l.durationSec, `${c.key}: ${l.title}`).toBeGreaterThan(60);
      }
    }
  });
});

describe("catalog promotion", () => {
  const base = {
    source: "COMMUNITY",
    isFeatured: false,
    listed: false,
    lecturesCount: 5,
    viewCount: 0,
    enrollCount: 0,
    wishlistCount: 0,
    completionCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: new Date(),
  };

  it("keeps new community courses unlisted", () => {
    expect(shouldBeListed(base)).toBe(false);
  });

  it("always lists imported and featured courses", () => {
    expect(shouldBeListed({ ...base, source: "CS50" })).toBe(true);
    expect(shouldBeListed({ ...base, isFeatured: true })).toBe(true);
  });

  it("promotes once views, learners and lectures clear the bar", () => {
    const hot = { ...base, viewCount: 200, enrollCount: 12 };
    expect(shouldBeListed(hot)).toBe(true);
    expect(shouldBeListed({ ...hot, lecturesCount: 2 })).toBe(false);
  });

  it("blocks promotion when reviews are poor", () => {
    expect(shouldBeListed({ ...base, viewCount: 500, enrollCount: 40, ratingAvg: 2, ratingCount: 10 })).toBe(false);
  });

  it("delists only when a listed course is reviewed badly by many", () => {
    const listed = { ...base, listed: true };
    expect(shouldBeListed(listed)).toBe(true);
    expect(shouldBeListed({ ...listed, ratingAvg: 1.5, ratingCount: 20 })).toBe(false);
  });

  it("ranks engagement higher and decays with age", () => {
    const now = Date.now();
    const quiet = trendScore({ ...base, viewCount: 10 }, now);
    const busy = trendScore({ ...base, viewCount: 10, enrollCount: 20, completionCount: 5 }, now);
    const old = trendScore({ ...base, viewCount: 10, enrollCount: 20, completionCount: 5, createdAt: new Date(now - 42 * 86_400_000) }, now);
    expect(busy).toBeGreaterThan(quiet);
    expect(old).toBeCloseTo(busy / 4, 3);
  });

  it("shrinks small-sample ratings toward 4", () => {
    expect(bayesianRating(5, 1)).toBeLessThan(bayesianRating(4.7, 500));
  });
});

describe("catalog URL state", () => {
  it("parses and sanitises params", () => {
    const p = parseCatalogParams({ q: " python ", level: "BEGINNER", duration: "forever", sort: "hack", page: "-3", category: "web-development" });
    expect(p).toMatchObject({ q: "python", level: "beginner", duration: null, sort: "relevance", page: 1, category: "Web Development" });
    expect(parseCatalogParams({ sort: "relevance" }).sort).toBe("popular");
  });

  it("builds canonical hrefs and resets page on filter change", () => {
    const p = parseCatalogParams({ q: "sql", page: "3" });
    expect(catalogHref(p, { page: 4 })).toBe("/courses?q=sql&page=4");
    expect(catalogHref(p, { level: "advanced" })).toBe("/courses?q=sql&level=advanced");
    expect(catalogHref(p, { q: "", category: "Law & Policy" })).toBe("/courses/category/law-and-policy");
    expect(categoryFromSlug(categorySlug("Law & Policy"))).toBe("Law & Policy");
    expect(isBrowseHome(parseCatalogParams({}))).toBe(true);
  });

  it("windows page numbers", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
    expect(pageWindow(2, 12)).toEqual([1, 2, 3, "gap", 12]);
  });
});
