import { describe, expect, it } from "vitest";
import { evaluateAchievements, type AchievementStats } from "./achievements";
import {
  branchPointsFor,
  dailyStreak,
  dpPairKey,
  eloDelta,
  eloExpected,
  rankBranches,
  triviaAnswerPoints,
} from "./scoring";
import { dayEndsAt, istDateString, previousWeekKey, weekEndsAt, weekKey, weekKeyOfDay, weekStartDay } from "./week";

describe("play weeks (IST)", () => {
  it("uses ISO week numbers", () => {
    expect(weekKeyOfDay("2026-11-23")).toBe("2026-W48"); // Monday
    expect(weekKeyOfDay("2026-11-29")).toBe("2026-W48"); // Sunday
    expect(weekKeyOfDay("2027-01-01")).toBe("2026-W53"); // Friday, still ISO 2026
    expect(weekKeyOfDay("2026-01-01")).toBe("2026-W01"); // Thursday
    expect(weekKeyOfDay("2024-12-30")).toBe("2025-W01"); // Monday of ISO 2025
  });

  it("switches day and week at IST midnight, not UTC", () => {
    // 2026-11-22 18:29 UTC = 23:59 IST Sunday; 18:30 UTC = 00:00 IST Monday.
    expect(istDateString(new Date("2026-11-22T18:29:00Z"))).toBe("2026-11-22");
    expect(istDateString(new Date("2026-11-22T18:30:00Z"))).toBe("2026-11-23");
    expect(weekKey(new Date("2026-11-22T18:29:00Z"))).toBe("2026-W47");
    expect(weekKey(new Date("2026-11-22T18:30:00Z"))).toBe("2026-W48");
  });

  it("finds the week start, end and previous week", () => {
    const now = new Date("2026-11-25T06:00:00Z"); // Wednesday
    expect(weekStartDay(now)).toBe("2026-11-23");
    expect(weekEndsAt(now)).toBe(Date.parse("2026-11-29T18:30:00Z"));
    expect(previousWeekKey(now)).toBe("2026-W47");
    expect(dayEndsAt(now)).toBe(Date.parse("2026-11-25T18:30:00Z"));
  });
});

describe("DP Battle Elo", () => {
  it("gives equal players half of K", () => {
    expect(eloExpected(1200, 1200)).toBeCloseTo(0.5);
    expect(eloDelta(1200, 1200)).toBe(16);
  });

  it("rewards upsets more than expected wins", () => {
    const upset = eloDelta(1100, 1400);
    const expected = eloDelta(1400, 1100);
    expect(upset).toBeGreaterThan(16);
    expect(expected).toBeLessThan(16);
    expect(upset + expected).toBe(32);
  });

  it("never gives zero for a win", () => {
    expect(eloDelta(3000, 100)).toBe(1);
  });

  it("builds the same pair key either way round", () => {
    expect(dpPairKey("b", "a")).toBe("a:b");
    expect(dpPairKey("a", "b")).toBe("a:b");
  });
});

describe("trivia scoring", () => {
  it("pays 150 for an instant right answer and 100 at the buzzer", () => {
    expect(triviaAnswerPoints(true, 0)).toBe(150);
    expect(triviaAnswerPoints(true, 20_000)).toBe(100);
    expect(triviaAnswerPoints(true, 10_000)).toBe(125);
  });

  it("pays nothing for wrong or late answers", () => {
    expect(triviaAnswerPoints(false, 1000)).toBe(0);
    expect(triviaAnswerPoints(true, 23_000)).toBe(0);
  });

  it("allows a little network slack after the limit", () => {
    expect(triviaAnswerPoints(true, 21_500)).toBe(100);
  });
});

describe("daily quiz streak", () => {
  it("counts a run that ends today or yesterday", () => {
    expect(dailyStreak(["2026-11-20", "2026-11-21", "2026-11-22"], "2026-11-22")).toEqual({ current: 3, best: 3 });
    expect(dailyStreak(["2026-11-20", "2026-11-21"], "2026-11-22")).toEqual({ current: 2, best: 2 });
  });

  it("resets after a missed day but keeps the best run", () => {
    const days = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-10"];
    expect(dailyStreak(days, "2026-11-12")).toEqual({ current: 0, best: 4 });
    expect(dailyStreak(days, "2026-11-10")).toEqual({ current: 1, best: 4 });
  });

  it("crosses month ends and ignores duplicates", () => {
    expect(dailyStreak(["2026-10-31", "2026-11-01", "2026-11-01"], "2026-11-01")).toEqual({ current: 2, best: 2 });
  });

  it("handles no plays", () => {
    expect(dailyStreak([], "2026-11-01")).toEqual({ current: 0, best: 0 });
  });
});

describe("Branch Wars", () => {
  it("caps This or That picks", () => {
    expect(branchPointsFor({ triviaCorrect: 5, totPicks: 100, memesPosted: 1, memeUpvotes: 4, dpWins: 3 })).toBe(
      10 + 30 + 5 + 4 + 3
    );
  });

  it("groups branch names loosely and skips students without a branch or points", () => {
    const rows = rankBranches([
      { branch: "CSE", points: 10 },
      { branch: " cse ", points: 5 },
      { branch: "ECE", points: 12 },
      { branch: null, points: 50 },
      { branch: "Mech", points: 0 },
    ]);
    expect(rows).toEqual([
      { branch: "CSE", points: 15, players: 2 },
      { branch: "ECE", points: 12, players: 1 },
    ]);
  });
});

const EMPTY: AchievementStats = {
  dpEntries: 0,
  dpWins: 0,
  dpWeekFinishes: [],
  memesPosted: 0,
  memeWins: [],
  triviaDone: 0,
  triviaPerfect: 0,
  triviaBestStreak: 0,
  totPicks: 0,
  branchWinWeeks: [],
};

describe("achievement rules", () => {
  const keys = (s: Partial<AchievementStats>) => evaluateAchievements({ ...EMPTY, ...s }).map((a) => `${a.key}@${a.context}`);

  it("earns nothing with no play", () => {
    expect(keys({})).toEqual([]);
  });

  it("awards one-time milestones", () => {
    expect(keys({ dpEntries: 1, dpWins: 1, triviaDone: 3, triviaBestStreak: 5, totPicks: 25 })).toEqual([
      "dp_enter@",
      "dp_first_win@",
      "trivia_first@",
      "trivia_streak_5@",
      "tot_25@",
    ]);
  });

  it("needs a big enough field for weekly DP badges", () => {
    expect(keys({ dpWeekFinishes: [{ week: "2026-W46", rank: 1, field: 4 }] })).toEqual([]);
    expect(keys({ dpWeekFinishes: [{ week: "2026-W46", rank: 1, field: 6 }] })).toEqual(["dp_champion@2026-W46"]);
    expect(keys({ dpWeekFinishes: [{ week: "2026-W46", rank: 3, field: 12 }] })).toEqual(["dp_top10@2026-W46"]);
    expect(keys({ dpWeekFinishes: [{ week: "2026-W47", rank: 1, field: 12 }] })).toEqual([
      "dp_champion@2026-W47",
      "dp_top10@2026-W47",
    ]);
  });

  it("needs real votes for a meme war win", () => {
    expect(keys({ memeWins: [{ week: "2026-W46", upvotes: 2, field: 10 }] })).toEqual([]);
    expect(keys({ memeWins: [{ week: "2026-W46", upvotes: 9, field: 2 }] })).toEqual([]);
    expect(keys({ memeWins: [{ week: "2026-W46", upvotes: 9, field: 5 }] })).toEqual(["meme_winner@2026-W46"]);
  });

  it("awards branch wins per week", () => {
    expect(keys({ branchWinWeeks: ["2026-W45", "2026-W46"] })).toEqual([
      "branch_champs@2026-W45",
      "branch_champs@2026-W46",
    ]);
  });
});
