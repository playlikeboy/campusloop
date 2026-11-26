import { describe, expect, it } from "vitest";
import { clampText, DESCRIPTION_MAX, fitDescription, fitTitle, TITLE_MAX } from "./describe";

describe("clampText", () => {
  it("keeps short text as is, with whitespace squashed", () => {
    expect(clampText("  Hello   world ", 20)).toBe("Hello world");
  });

  it("cuts at a word boundary and adds an ellipsis", () => {
    const out = clampText("The quick brown fox jumps over the lazy dog", 20);
    expect(out).toBe("The quick brown fox…");
    expect(out.length).toBeLessThanOrEqual(20);
  });

  it("drops trailing punctuation before the ellipsis", () => {
    expect(clampText("Alpha beta, gamma delta epsilon", 13)).toBe("Alpha beta…");
  });

  it("handles empty input", () => {
    expect(clampText(null, 10)).toBe("");
  });
});

describe("fitTitle", () => {
  it("keeps titles within the bare-title limit", () => {
    const long = "Data Structures & Algorithms (CS301) Solved PYQs & Exam Questions for 2026";
    expect(fitTitle(long).length).toBeLessThanOrEqual(TITLE_MAX);
    expect(fitTitle("Events")).toBe("Events");
  });
});

describe("fitDescription", () => {
  it("cuts a long lead to the max length", () => {
    const lead = "word ".repeat(80);
    const out = fitDescription(lead);
    expect(out.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(out.endsWith("…")).toBe(true);
  });

  it("pads a short lead with facts until it reaches the minimum", () => {
    const out = fitDescription("Hackathon on water", [
      "On 12 Jan 2027 at IIT Delhi",
      null,
      "Hosted by the Coding Club",
      "Free entry, register on CampusLoop",
    ]);
    expect(out).toBe(
      "Hackathon on water. On 12 Jan 2027 at IIT Delhi. Hosted by the Coding Club. Free entry, register on CampusLoop."
    );
    expect(out.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it("skips a fact that would push it past the max", () => {
    const lead = "a".repeat(100);
    const out = fitDescription(lead, ["b".repeat(80), "Short fact here"]);
    expect(out).toBe(`${lead}. Short fact here.`);
  });

  it("stops adding facts once the minimum is reached", () => {
    const lead = "x".repeat(125);
    expect(fitDescription(lead, ["More"])).toBe(`${lead}.`);
  });

  it("works with no lead", () => {
    expect(fitDescription("", ["First fact", "Second fact"], { min: 5 })).toBe("First fact.");
  });
});
