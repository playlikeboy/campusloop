import { describe, expect, it } from "vitest";
import cs50 from "@/data/courses/cs50.json";
import { formatClock, formatDuration, parseVideoUrl, slugifyCourse } from "./format";
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
