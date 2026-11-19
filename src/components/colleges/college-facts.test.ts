import { describe, expect, it } from "vitest";
import {
  collegeFacts,
  collegeFaqs,
  collegeMetaDescription,
  collegeMetaTitle,
  collegeShortName,
  collegeSummary,
  isCollegeIndexable,
} from "./college-facts";

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

describe("college search metadata", () => {
  it("keeps titles within 58 characters", () => {
    expect(collegeMetaTitle(base)).toBe("Birla Institute of Technology: notes, PYQs and students");
    const long = collegeMetaTitle({ name: "Shri Mata Vaishno Devi University of Advanced Research", state: "J&K" });
    expect(long.length).toBeLessThanOrEqual(58);
  });

  it("describes only what exists, within 155 characters", () => {
    const text = collegeMetaDescription(base);
    expect(text).toContain("25 free notes and PYQs");
    expect(text).toContain("@bitmesra.ac.in");
    expect(text.length).toBeLessThanOrEqual(155);
    const empty = collegeMetaDescription({ ...base, noteCount: 0, postCount: 0, nirfRank: null });
    expect(empty).not.toMatch(/\d+ (free notes|student posts)/);
  });

  it("indexes a college only when it has content or a rank", () => {
    const none = { studentCount: 0, postCount: 0, noteCount: 0, nirfRank: null };
    expect(isCollegeIndexable(none)).toBe(false);
    expect(isCollegeIndexable({ ...none, studentCount: 4, postCount: 2, noteCount: 2 })).toBe(false);
    expect(isCollegeIndexable({ ...none, studentCount: 5 })).toBe(true);
    expect(isCollegeIndexable({ ...none, postCount: 3 })).toBe(true);
    expect(isCollegeIndexable({ ...none, noteCount: 3 })).toBe(true);
    expect(isCollegeIndexable({ ...none, nirfRank: 53 })).toBe(true);
  });
});
