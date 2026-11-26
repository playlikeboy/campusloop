import { describe, expect, it } from "vitest";
import { articleByline, EDITORIAL_PATH, isEditorialTopic } from "./byline";

const author = { displayName: "Shaswat Raj", username: "sh20raj" };

describe("articleByline", () => {
  it("keeps the real author on tech and engineering pieces", () => {
    const b = articleByline({ category: "WEB_DEVELOPMENT", title: "Next.js caching explained", tags: ["nextjs"], author });
    expect(b).toEqual({ kind: "person", name: "Shaswat Raj", username: "sh20raj", path: "/authors/sh20raj" });
  });

  it("credits health and finance categories to CampusLoop Editorial", () => {
    for (const category of ["HEALTH", "FINANCE", "SCHOLARSHIPS", "TRAVEL"]) {
      const b = articleByline({ category, title: "Anything", author });
      expect(b.kind).toBe("organization");
      expect(b.path).toBe(EDITORIAL_PATH);
      expect(b.name).toBe("CampusLoop Editorial");
    }
  });

  it("credits non-tech careers in career categories to Editorial", () => {
    expect(isEditorialTopic({ category: "CAREER_ADVICE", title: "Nursing careers after 12th" })).toBe(true);
    expect(isEditorialTopic({ category: "JOBS_AND_CAREER", title: "Jobs", tags: ["mutual-funds"] })).toBe(true);
    expect(isEditorialTopic({ category: "CAREER_ADVICE", title: "AAI ATC exam", tags: ["aviation jobs"] })).toBe(true);
  });

  it("matches whole words only", () => {
    expect(isEditorialTopic({ category: "DSA", title: "Graph taxonomy and Moore's law in CPUs" })).toBe(false);
    expect(isEditorialTopic({ category: "CAREER_ADVICE", title: "Resume tips for SDE roles" })).toBe(false);
  });

  it("falls back to the handle when there is no display name", () => {
    expect(articleByline({ category: "DSA", author: { displayName: "", username: "asha" } }).name).toBe("@asha");
  });
});
