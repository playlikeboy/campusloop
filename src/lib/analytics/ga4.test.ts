import { describe, expect, it } from "vitest";
import { estimateGradYear, inferContentGroup, isoWeek } from "./ga4";

describe("isoWeek", () => {
  it("labels ISO weeks, including year boundaries", () => {
    expect(isoWeek("2026-11-19T10:00:00Z")).toBe("2026-W47");
    expect(isoWeek("2021-01-01T00:00:00Z")).toBe("2020-W53");
    expect(isoWeek("not a date")).toBeUndefined();
  });
});

describe("estimateGradYear", () => {
  it("adds the remaining years of a 4-year course to the current academic year", () => {
    expect(estimateGradYear(1, new Date("2026-11-19"))).toBe(2030);
    expect(estimateGradYear(4, new Date("2026-03-01"))).toBe(2026);
    expect(estimateGradYear(null)).toBeUndefined();
  });
});

describe("inferContentGroup", () => {
  it("buckets the kept sections", () => {
    expect(inferContentGroup("/board?tab=rides")).toBe("board");
    expect(inferContentGroup("/download")).toBe("download");
    expect(inferContentGroup("/marketplace")).toBe("other");
  });
});
