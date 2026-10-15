import { describe, expect, it } from "vitest";
import {
  attentionFairnessMultiplier,
  computeReciprocalRank,
  estimateLikeBackRate,
  isMutualGenderMatch,
} from "@/lib/dating";
import {
  activityRecencyMultiplier,
  bayesianRate,
  examSeasonBoost,
  reciprocalScore,
  wilsonLowerBound,
} from "./scoring-primitives";
import { normalizeTypeCounts } from "./viewer-affinity";

describe("scoring primitives", () => {
  it("wilson lower bound prefers large confident samples over tiny perfect ones", () => {
    expect(wilsonLowerBound(95, 100)).toBeGreaterThan(wilsonLowerBound(4, 4));
    expect(wilsonLowerBound(0, 0)).toBe(0);
  });

  it("bayesian rate shrinks small samples toward the prior", () => {
    expect(bayesianRate(1, 1, 0.35, 10)).toBeCloseTo(4.5 / 11);
    expect(bayesianRate(0, 0, 0.35, 10)).toBeCloseTo(0.35);
  });

  it("reciprocal score is zero if either side is zero and symmetric otherwise", () => {
    expect(reciprocalScore(0.9, 0)).toBe(0);
    expect(reciprocalScore(0.4, 0.8)).toBeCloseTo(reciprocalScore(0.8, 0.4));
  });

  it("exam boost only applies to exam-prep formats and peaks in exam months", () => {
    expect(examSeasonBoost("NOTES", new Date("2026-11-10"))).toBe(0);
    expect(examSeasonBoost("PYQ", new Date("2026-11-10"))).toBe(30);
    expect(examSeasonBoost("PYQ", new Date("2026-07-10"))).toBeLessThan(30);
  });

  it("activity recency rewards recently active users", () => {
    const now = Date.now();
    expect(activityRecencyMultiplier(new Date(now - 3_600_000), now)).toBeGreaterThan(
      activityRecencyMultiplier(new Date(now - 30 * 86_400_000), now)
    );
  });

  it("normalizes type counts into shares", () => {
    expect(normalizeTypeCounts({ POLL: 3, MEME: 1 })).toEqual({ POLL: 0.75, MEME: 0.25 });
    expect(normalizeTypeCounts({})).toEqual({});
  });
});

describe("reciprocal matching", () => {
  it("ranks a selective swiper below an open one at equal compatibility", () => {
    const picky = { likesGiven: 2, swipesGiven: 100, likesReceived: 10, swipesReceived: 30 };
    const open = { likesGiven: 60, swipesGiven: 100, likesReceived: 10, swipesReceived: 30 };
    expect(estimateLikeBackRate(open)).toBeGreaterThan(estimateLikeBackRate(picky));
    expect(computeReciprocalRank(70, { likedMe: false, stats: open })).toBeGreaterThan(
      computeReciprocalRank(70, { likedMe: false, stats: picky })
    );
  });

  it("lifts under-exposed profiles and damps saturated ones", () => {
    expect(attentionFairnessMultiplier(undefined)).toBeGreaterThan(1);
    expect(
      attentionFairnessMultiplier({ likesGiven: 0, swipesGiven: 0, likesReceived: 90, swipesReceived: 100 })
    ).toBeLessThan(1);
  });

  it("requires both sides' gender preferences to match", () => {
    const me = { gender: "MALE", preferredGender: "FEMALE" as const };
    expect(isMutualGenderMatch(me, { gender: "FEMALE", datingPreferences: null })).toBe(true);
    expect(isMutualGenderMatch(me, { gender: "FEMALE", datingPreferences: { gender: "FEMALE" } })).toBe(false);
    expect(isMutualGenderMatch(me, { gender: "MALE", datingPreferences: { gender: "ALL" } })).toBe(false);
  });
});
