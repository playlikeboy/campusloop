import { describe, expect, it } from "vitest";
import { STREAK_MILESTONES, STREAK_QUALIFYING_EVENTS } from "@/constants/streaks";
import {
  getLocalDateString,
  getRecentCalendarDays,
  getYesterdayDateString,
  recordStreakActivity,
} from "./streak-service";

describe("Streak Service Date Helpers & Timezones", () => {
  it("formats date in Asia/Kolkata timezone accurately", () => {
    // 2026-10-06 20:00:00 UTC is 2026-10-07 01:30:00 IST
    const lateUtc = new Date("2026-10-06T20:00:00.000Z");
    const istDate = getLocalDateString(lateUtc, "Asia/Kolkata");
    expect(istDate).toBe("2026-10-07");

    // 2026-10-06 10:00:00 UTC is 2026-10-06 15:30:00 IST
    const midUtc = new Date("2026-10-06T10:00:00.000Z");
    const midIstDate = getLocalDateString(midUtc, "Asia/Kolkata");
    expect(midIstDate).toBe("2026-10-06");
  });

  it("handles midnight boundary in IST", () => {
    // 2026-10-06 18:29:59 UTC is 2026-10-06 23:59:59 IST
    const justBeforeMidnight = new Date("2026-10-06T18:29:59.000Z");
    expect(getLocalDateString(justBeforeMidnight, "Asia/Kolkata")).toBe("2026-10-06");

    // 2026-10-06 18:30:01 UTC is 2026-10-07 00:00:01 IST
    const justAfterMidnight = new Date("2026-10-06T18:30:01.000Z");
    expect(getLocalDateString(justAfterMidnight, "Asia/Kolkata")).toBe("2026-10-07");
  });

  it("calculates yesterday's date string across month and year boundaries", () => {
    expect(getYesterdayDateString("2026-10-06")).toBe("2026-10-05");
    expect(getYesterdayDateString("2026-10-01")).toBe("2026-09-30");
    expect(getYesterdayDateString("2026-01-01")).toBe("2025-12-31");
    expect(getYesterdayDateString("2024-03-01")).toBe("2024-02-29"); // leap year
  });

  it("generates a sequence of 7 consecutive calendar days ending today", () => {
    const days = getRecentCalendarDays(7, "2026-10-06");
    expect(days).toEqual([
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
    ]);
    expect(days[days.length - 1]).toBe("2026-10-06");
  });

  it("generates a sequence of 28 consecutive days for monthly calendar", () => {
    const days = getRecentCalendarDays(28, "2026-10-28");
    expect(days.length).toBe(28);
    expect(days[0]).toBe("2026-10-01");
    expect(days[27]).toBe("2026-10-28");
  });
});

describe("Streak Milestones & Progression Invariants", () => {
  it("defines strictly ascending milestone tiers with unique day thresholds", () => {
    const dayThresholds = STREAK_MILESTONES.map((m) => m.days);
    for (let i = 1; i < dayThresholds.length; i++) {
      expect(dayThresholds[i]).toBeGreaterThan(dayThresholds[i - 1]);
    }
  });

  it("ensures all milestone reward bonuses are positive", () => {
    for (const milestone of STREAK_MILESTONES) {
      expect(milestone.points).toBeGreaterThan(0);
      expect(milestone.title.length).toBeGreaterThan(0);
      expect(milestone.badge.length).toBeGreaterThan(0);
    }
  });

  it("includes core milestones at 3, 7, 14, 30 days", () => {
    const days = STREAK_MILESTONES.map((m) => m.days);
    expect(days).toContain(3);
    expect(days).toContain(7);
    expect(days).toContain(14);
    expect(days).toContain(30);
  });
});

describe("Qualifying Actions Integrity", () => {
  it("validates all 9 qualifying events have points bonuses and descriptions", () => {
    const events = Object.values(STREAK_QUALIFYING_EVENTS);
    expect(events.length).toBe(9);

    for (const ev of events) {
      expect(ev.pointsBonus).toBeGreaterThan(0);
      expect(ev.label.length).toBeGreaterThan(0);
      expect(ev.description.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid or unauthorized event types gracefully", async () => {
    const result = await recordStreakActivity({
      userId: "",
      eventType: "INVALID_EVENT" as any,
    });
    expect(result.success).toBe(false);
    expect(result.pointsEarned).toBe(0);
  });
});

describe("Streak Progression Mathematical Simulation", () => {
  it("simulates consecutive day progression", () => {
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate: string | null = null;

    const days = ["2026-10-01", "2026-10-02", "2026-10-03"];
    for (const today of days) {
      const yesterday = getYesterdayDateString(today);
      if (lastDate === today) {
        // Same-day duplicate - no increment
        continue;
      } else if (lastDate === yesterday) {
        // Consecutive
        currentStreak += 1;
      } else {
        // Missed or first day
        currentStreak = 1;
      }
      lastDate = today;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }

    expect(currentStreak).toBe(3);
    expect(longestStreak).toBe(3);
  });

  it("simulates broken streak behavior (missed day resets current run without altering previous best)", () => {
    let currentStreak = 10;
    let longestStreak = 10;
    let lastDate = "2026-10-01";

    // Gap: Next activity is on 2026-10-05 (missed Oct 2, 3, 4)
    const today = "2026-10-05";
    const yesterday = getYesterdayDateString(today); // 2026-10-04

    if (lastDate === today) {
      // no op
    } else if (lastDate === yesterday) {
      currentStreak += 1;
    } else {
      // broken streak
      currentStreak = 1;
    }
    lastDate = today;
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    expect(currentStreak).toBe(1);
    expect(longestStreak).toBe(10); // Preserves previous best!
  });

  it("simulates milestone unlocking and claim deduplication", () => {
    const claimedMilestones = new Set<number>();
    let awardedPoints = 0;

    function checkMilestone(streak: number) {
      const milestone = STREAK_MILESTONES.find((m) => m.days === streak);
      if (milestone && !claimedMilestones.has(milestone.days)) {
        claimedMilestones.add(milestone.days);
        awardedPoints += milestone.points;
        return milestone;
      }
      return null;
    }

    // Day 3 hit
    const m3 = checkMilestone(3);
    expect(m3).not.toBeNull();
    expect(m3?.days).toBe(3);
    expect(awardedPoints).toBe(15);

    // Duplicate check on Day 3 (retry/concurrency)
    const m3Duplicate = checkMilestone(3);
    expect(m3Duplicate).toBeNull();
    expect(awardedPoints).toBe(15); // Idempotent!

    // Day 7 hit
    const m7 = checkMilestone(7);
    expect(m7).not.toBeNull();
    expect(m7?.days).toBe(7);
    expect(awardedPoints).toBe(40); // 15 + 25
  });
});
