import { describe, expect, it } from "vitest";
import {
  engagementCopy,
  isQuietHours,
  istDate,
  istDayStart,
  istMinuteOfDay,
  kindsDueAt,
  underDailyCap,
  winbackKind,
} from "./schedule";

/** Builds the UTC instant for an IST wall-clock time on 2026-11-19. */
function ist(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 10, 19, hour, minute) - (5 * 60 + 30) * 60_000);
}

describe("IST helpers", () => {
  it("reads IST minutes and dates", () => {
    expect(istMinuteOfDay(ist(20, 30))).toBe(20 * 60 + 30);
    expect(istDate(ist(0, 10))).toBe("2026-11-19");
    expect(istDate(ist(23, 59))).toBe("2026-11-19");
    expect(istDayStart(ist(15)).toISOString()).toBe("2026-11-18T18:30:00.000Z");
  });

  it("keeps quiet hours from 23:00 to 08:00", () => {
    expect(isQuietHours(ist(23))).toBe(true);
    expect(isQuietHours(ist(2))).toBe(true);
    expect(isQuietHours(ist(7, 59))).toBe(true);
    expect(isQuietHours(ist(8))).toBe(false);
    expect(isQuietHours(ist(22, 59))).toBe(false);
  });
});

describe("kindsDueAt", () => {
  it("sends the streak reminder from 20:30 only", () => {
    expect(kindsDueAt(ist(20, 0))).not.toContain("STREAK_AT_RISK");
    expect(kindsDueAt(ist(20, 30))).toContain("STREAK_AT_RISK");
    expect(kindsDueAt(ist(22, 30))).toContain("STREAK_AT_RISK");
  });

  it("sends the digest at 18:00", () => {
    expect(kindsDueAt(ist(18, 0))).toEqual(["DAILY_DIGEST"]);
  });

  it("sends nothing in quiet hours", () => {
    expect(kindsDueAt(ist(23, 0))).toEqual([]);
    expect(kindsDueAt(ist(3, 0))).toEqual([]);
  });
});

describe("caps and win-backs", () => {
  it("allows at most 3 pushes a day", () => {
    expect(underDailyCap(0)).toBe(true);
    expect(underDailyCap(2)).toBe(true);
    expect(underDailyCap(3)).toBe(false);
  });

  it("picks the win-back by days away", () => {
    const now = ist(12);
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
    expect(winbackKind(daysAgo(2), now)).toBeNull();
    expect(winbackKind(daysAgo(3.5), now)).toBe("WINBACK_3D");
    expect(winbackKind(daysAgo(7.2), now)).toBe("WINBACK_7D");
    expect(winbackKind(daysAgo(9), now)).toBeNull();
    expect(winbackKind(null, now)).toBeNull();
  });
});

describe("engagementCopy", () => {
  it("never writes copy without a real count", () => {
    expect(engagementCopy("DAILY_DIGEST", { count: 0, campus: "BIT Mesra" })).toBeNull();
    expect(engagementCopy("WINBACK_3D", { count: 0 })).toBeNull();
    expect(engagementCopy("STREAK_AT_RISK", { streak: 0 })).toBeNull();
  });

  it("uses the counts it is given", () => {
    expect(engagementCopy("DAILY_DIGEST", { count: 3, campus: "BIT Mesra" })?.title).toBe(
      "3 new confessions at BIT Mesra"
    );
    expect(engagementCopy("STREAK_AT_RISK", { streak: 1 })?.title).toBe("Your 1 day streak ends at midnight");
    expect(engagementCopy("WINBACK_7D", { count: 1, campus: "IIT Delhi" })?.title).toBe("1 new post at IIT Delhi");
  });
});
