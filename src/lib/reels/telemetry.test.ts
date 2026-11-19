import { describe, expect, it } from "vitest";
import { scrolledPastFraction } from "@/hooks/feed-prefetch";
import { isLoopWrap, summarizeReelView } from "./telemetry";

describe("reel telemetry", () => {
  it("classifies quick skips, completions and loops", () => {
    expect(summarizeReelView({ watchMs: 800, durationMs: 15_000, loops: 0, maxPositionMs: 800 })).toMatchObject({
      skippedQuickly: true,
      completed: false,
      action: "skip",
    });
    expect(summarizeReelView({ watchMs: 14_000, durationMs: 15_000, loops: 0, maxPositionMs: 14_000 })).toMatchObject({
      completed: true,
      skippedQuickly: false,
      action: "dwell",
    });
    expect(summarizeReelView({ watchMs: 40_000, durationMs: 15_000, loops: 2, maxPositionMs: 15_000 })).toMatchObject({
      loopCount: 2,
      completed: true,
      action: "loop",
    });
  });

  it("detects the playhead wrapping to the start", () => {
    expect(isLoopWrap(14.6, 0.2, 15)).toBe(true);
    expect(isLoopWrap(5, 0.2, 15)).toBe(false); // user seeked back
    expect(isLoopWrap(14.6, 0.2, Number.NaN)).toBe(false);
  });
});

describe("feed prefetch", () => {
  it("fires at 60% of the scrollable content", () => {
    expect(scrolledPastFraction(0, 800, 10_000)).toBe(false);
    expect(scrolledPastFraction(5_000, 800, 10_000)).toBe(false); // 58%
    expect(scrolledPastFraction(5_200, 800, 10_000)).toBe(true); // 60%
    expect(scrolledPastFraction(0, 800, 1_000)).toBe(true); // short list: fetch more now
  });
});
