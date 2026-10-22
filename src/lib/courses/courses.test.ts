import { describe, expect, it } from "vitest";
import cs50 from "@/data/courses/cs50.json";
import { cleanTitle, dedupeEditions } from "../../../scripts/courses/import-youtube";
import { attributionNote, courseProvider, formatClock, formatDuration, parseVideoUrl, slugifyCourse } from "./format";
import { catalogHref, categoryFromSlug, categorySlug, isBrowseHome, pageWindow, parseCatalogParams } from "./catalog-params";
import { collapsePrefixes } from "../search-history";
import { buildSignals, fieldCategories, rankDiverse, type ScorableCourse, slotTitle } from "./recommend-signals";
import { bayesianRating, ratingPrior, SOURCE_BOOST, shouldBeListed, trendScore } from "./promotion";
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

describe("imported courses", () => {
  it("keeps one edition per course code, newest first, Andrew Ng's CS229 winning", () => {
    const lists = [
      { title: "CMU Intro to Database Systems (15-445/645 - Fall 2023)", videoCount: 26 },
      { title: "CMU Intro to Database Systems (15-445/645 - Fall 2025)", videoCount: 25 },
      { title: "Stanford CS229: Machine Learning I Spring 2022", videoCount: 19 },
      { title: "Stanford CS229: Machine Learning led by Andrew Ng | Autumn 2018", videoCount: 21 },
      { title: "DBMS (Database Management system) Complete Playlist", videoCount: 140 },
    ];
    expect(dedupeEditions(lists).map((l) => l.title)).toEqual([
      "CMU Intro to Database Systems (15-445/645 - Fall 2025)",
      "Stanford CS229: Machine Learning led by Andrew Ng | Autumn 2018",
      "DBMS (Database Management system) Complete Playlist",
    ]);
  });

  it("cleans playlist titles", () => {
    expect(cleanTitle("Python for Beginners (Full Course) | #100DaysOfCode Programming Tutorial in Hindi", "CodeWithHarry")).toBe("Python for Beginners (Full Course)");
    expect(cleanTitle("Computer Sc - Data Structures and Algorithms", "NPTEL", /^(Computer Sc(ience)?)\s*-\s+/i)).toBe("Data Structures and Algorithms");
    expect(cleanTitle("Sigma Web Development Course 🗿", "CodeWithHarry")).toBe("Sigma Web Development Course");
    expect(cleanTitle("Stanford CS224N Natural Language Processing with Deep Learning I Spring 2024 I Professor Christopher Manning", "Stanford Online")).toBe("Stanford CS224N Natural Language Processing with Deep Learning");
  });

  it("ranks curated sources above educators above community, without touching displayed ratings", () => {
    expect(SOURCE_BOOST.CS50).toBeGreaterThan(SOURCE_BOOST.UNIVERSITY);
    expect(SOURCE_BOOST.UNIVERSITY).toBeGreaterThan(SOURCE_BOOST.CREATOR);
    expect(SOURCE_BOOST.CREATOR).toBeGreaterThan(SOURCE_BOOST.COMMUNITY);
    expect(ratingPrior(SOURCE_BOOST.CS50)).toBeCloseTo(4.7);
  });

  it("attributes imported courses and not community ones", () => {
    const yt = { source: "CREATOR", provider: "Gate Smashers", instructorName: "Gate Smashers", license: null };
    expect(attributionNote(yt)).toContain("CampusLoop is not affiliated with Gate Smashers");
    expect(attributionNote({ ...yt, source: "COMMUNITY" })).toBeNull();
    expect(courseProvider({ source: "CS50", instructorName: "x" })).toBe("CS50 at Harvard University");
  });

  it("parses the language filter", () => {
    expect(parseCatalogParams({ lang: "Hindi" }).lang).toBe("hindi");
    expect(catalogHref(parseCatalogParams({ lang: "hindi", source: "creator" }))).toBe("/courses?source=creator&lang=hindi");
  });
});

describe("course personalisation", () => {
  const course = (id: string, over: Partial<ScorableCourse> = {}): ScorableCourse => ({
    id,
    title: "Course",
    subtitle: null,
    category: "General",
    tags: [],
    provider: id,
    rankBoost: 0.4,
    enrollCount: 0,
    trendScore: 0,
    ...over,
  });

  it("maps degrees and branches to fields beyond computing", () => {
    expect(fieldCategories("Mechanical Engineering")).toContain("Mechanical Engineering");
    expect(fieldCategories("BBA LLB")).toEqual(expect.arrayContaining(["Business", "Law & Policy"]));
    expect(fieldCategories("MBBS")).toContain("Medicine");
    expect(fieldCategories("B.Com")).toContain("Finance & Accounting");
  });

  it("puts the latest search ahead of branch and explains why", () => {
    const s = buildSignals({ branch: "CSE", searches: ["dbms normalization", "python"] });
    const ranked = rankDiverse(
      [
        course("py", { title: "Python for beginners", category: "Programming" }),
        course("db", { title: "DBMS complete playlist", category: "Databases", tags: ["dbms"] }),
        course("law", { title: "Contract law", category: "Law & Policy" }),
      ],
      s,
      3
    );
    expect(ranked[0].id).toBe("db");
    expect(ranked[1].id).toBe("py");
    // Academic domain isolation ensures law is excluded from computing searches
    expect(ranked.map((c) => c.id)).not.toContain("law");
    expect(slotTitle(s)).toBe('Because you searched "dbms normalization"');
  });

  it("isolates academic domains so DBMS search shows only computing recommendations and strictly excludes business", () => {
    const s = buildSignals({ branch: "CSE", searches: ["DBMS"] });
    expect(s.targetDomain).toBe("computing");
    const pool = [
      course("db", { title: "Database Management Systems", category: "Databases", tags: ["dbms", "sql"] }),
      course("dsa", { title: "Data Structures & Algorithms", category: "Computer Science", tags: ["dsa"] }),
      course("biz", { title: "Business Management & Operations", category: "Business", tags: ["management"] }),
      course("fin", { title: "Financial Accounting & Reporting", category: "Finance & Accounting", tags: ["accounting"] }),
    ];
    const ranked = rankDiverse(pool, s, 4);
    expect(ranked.map((c) => c.id)).toContain("db");
    expect(ranked.map((c) => c.id)).toContain("dsa");
    expect(ranked.map((c) => c.id)).not.toContain("biz");
    expect(ranked.map((c) => c.id)).not.toContain("fin");
  });

  it("personalizes feed courses from student's syllabus and /academics saved resources", () => {
    const s = buildSignals({ branch: "Computer Science", academicSubjects: ["Operating Systems", "Computer Networks"] });
    expect(slotTitle(s)).toBe("Courses for your Operating Systems syllabus");
    expect(s.targetDomain).toBe("computing");
  });

  it("skips enrolled courses and caps one provider", () => {
    const s = buildSignals({ branch: "CSE", enrolled: [{ id: "a", category: "Programming", tags: [] }] });
    const pool = ["a", "b", "c", "d"].map((id) => course(id, { category: "Programming", provider: "Same" }));
    const ranked = rankDiverse(pool, s, 4);
    expect(ranked.map((c) => c.id)).not.toContain("a");
    expect(ranked.length).toBe(2);
  });

  it("collapses typed-out search prefixes", () => {
    expect(collapsePrefixes(["dbms", "dbm", "db", "python"])).toEqual(["dbms", "python"]);
  });
});
