import { describe, expect, it } from "vitest";
import { collegeFacts, collegeFaqs, collegeShortName, collegeSummary } from "./college-facts";

const base = {
  name: "Birla Institute of Technology, Mesra",
  district: "Ranchi",
  state: "Jharkhand",
  yearOfEstablishment: 1955,
  nirfRank: 53,
  aisheCode: "U-0205",
  locationType: "Urban",
  websiteHost: "bitmesra.ac.in",
  emailDomains: ["bitmesra.ac.in"],
  studentCount: 67,
  postCount: 120,
  noteCount: 25,
};

describe("college facts", () => {
  it("shortens the name at the first comma", () => {
    expect(collegeShortName(base.name)).toBe("Birla Institute of Technology");
  });

  it("lists only facts that exist and hides system AISHE codes", () => {
    expect(collegeFacts(base).map((f) => f.label)).toEqual([
      "Location",
      "Established",
      "NIRF rank",
      "Campus type",
      "AISHE code",
      "Website",
      "Student email",
    ]);
    const bare = collegeFacts({
      ...base,
      district: null,
      state: null,
      yearOfEstablishment: null,
      nirfRank: null,
      aisheCode: "SYSTEM-VIEWER-HUB",
      locationType: null,
      websiteHost: null,
      emailDomains: [],
    });
    expect(bare).toEqual([]);
  });

  it("writes FAQ answers from real numbers", () => {
    const faqs = collegeFaqs(base);
    expect(faqs).toHaveLength(4);
    expect(faqs[0].a).toContain("@bitmesra.ac.in");
    expect(faqs[2].a).toContain("25 notes");
    expect(collegeFaqs({ ...base, noteCount: 0, emailDomains: [] })[2].a).toMatch(/^Not yet/);
  });

  it("summarises a college without a description, with no invented numbers", () => {
    expect(collegeSummary(base)).toContain("67 of its students are on CampusLoop");
    const empty = collegeSummary({ ...base, studentCount: 0, nirfRank: null });
    expect(empty).not.toMatch(/\d+ of its students/);
    expect(empty).not.toContain("NIRF");
  });
});
