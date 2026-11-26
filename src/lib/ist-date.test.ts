import { describe, expect, it } from "vitest";
import { istDate, istTime, istYear } from "./ist-date";

// 10 Feb 2027, 04:00 UTC = 09:30 IST
const d = "2027-02-10T04:00:00.000Z";

describe("istDate", () => {
  it("formats in India time whatever the runtime zone", () => {
    expect(istDate(d)).toBe("10 Feb");
    expect(istDate(d, { weekday: "short" })).toBe("Wed, 10 Feb");
    expect(istDate(d, { weekday: "long", month: "long", year: true })).toBe("Wednesday, 10 February 2027");
    expect(istDate(d, { year: true })).toBe("10 Feb 2027");
  });

  it("rolls over to the next day after 18:30 UTC", () => {
    expect(istDate("2027-02-10T19:00:00.000Z")).toBe("11 Feb");
  });

  it("returns null for missing or bad dates", () => {
    expect(istDate(null)).toBeNull();
    expect(istDate("not a date")).toBeNull();
  });
});

describe("istTime", () => {
  it("gives a lower-case 12-hour time", () => {
    expect(istTime(d)).toBe("9:30 am");
    expect(istTime("2027-02-10T10:45:00.000Z")).toBe("4:15 pm");
  });
});

describe("istYear", () => {
  it("uses the India date for the year", () => {
    expect(istYear("2026-12-31T19:00:00.000Z")).toBe(2027);
  });
});
