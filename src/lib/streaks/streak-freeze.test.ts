import { describe, expect, it } from "vitest";
import { missedDaysToFreeze } from "./streak-freeze";

describe("missedDaysToFreeze", () => {
  it("fills one missed day with one freeze", () => {
    expect(missedDaysToFreeze("2026-11-17", "2026-11-19", 1)).toEqual(["2026-11-18"]);
  });

  it("does nothing when nothing was missed", () => {
    expect(missedDaysToFreeze("2026-11-18", "2026-11-19", 2)).toEqual([]);
    expect(missedDaysToFreeze("2026-11-19", "2026-11-19", 2)).toEqual([]);
  });

  it("does nothing without freezes or history", () => {
    expect(missedDaysToFreeze("2026-11-17", "2026-11-19", 0)).toEqual([]);
    expect(missedDaysToFreeze(null, "2026-11-19", 2)).toEqual([]);
  });

  it("covers two missed days only with two freezes", () => {
    expect(missedDaysToFreeze("2026-11-16", "2026-11-19", 1)).toEqual([]);
    expect(missedDaysToFreeze("2026-11-16", "2026-11-19", 2)).toEqual(["2026-11-17", "2026-11-18"]);
  });

  it("crosses month ends", () => {
    expect(missedDaysToFreeze("2026-11-29", "2026-12-01", 1)).toEqual(["2026-11-30"]);
  });
});
