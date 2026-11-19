import { describe, expect, it } from "vitest";
import { isUtmRefCode, parseUtm, utmRefCode } from "./utm";

describe("parseUtm", () => {
  it("returns null without utm_source", () => {
    expect(parseUtm(new URLSearchParams("utm_campaign=x"))).toBeNull();
  });
  it("normalises tags and drops empty ones", () => {
    const tags = parseUtm(new URLSearchParams("utm_source=Instagram&utm_medium=Bio Link&utm_campaign=reel 12!"));
    expect(tags).toEqual({ source: "instagram", medium: "bio-link", campaign: "reel-12" });
  });
});

describe("utmRefCode", () => {
  it("builds a prefixed code and trims trailing blanks", () => {
    expect(utmRefCode({ source: "instagram" })).toBe("utm:instagram");
    expect(utmRefCode({ source: "instagram", campaign: "reel-12" })).toBe("utm:instagram/-/reel-12");
    expect(utmRefCode({ source: "x".repeat(40), medium: "y".repeat(40), campaign: "z".repeat(40), content: "w".repeat(40) }).length)
      .toBeLessThanOrEqual(128);
  });
  it("never looks like a username", () => {
    expect(isUtmRefCode(utmRefCode({ source: "instagram" }))).toBe(true);
    expect(isUtmRefCode("riya_01")).toBe(false);
  });
});
