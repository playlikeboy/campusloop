import { describe, expect, it } from "vitest";
import { evaluateActionSequence, type UserActionEvent } from "./bdsm-engine";

describe("BDSM: Behavioral Detection Sequence Model & Scarecrow Rules", () => {
  it("flags superhuman like bursts with elevated LikeBot head score", () => {
    const baseTime = Date.now();
    // Simulate automated script firing 10 likes in 3 seconds
    const botEvents: UserActionEvent[] = Array.from({ length: 10 }).map((_, i) => ({
      userId: "bot_123",
      action: "LIKE",
      targetId: `post_${i}`,
      timestamp: baseTime + i * 300,
    }));

    const result = evaluateActionSequence(botEvents);
    expect(result.heads.LikeBot).toBeGreaterThan(0.7);
    expect(result.isBotSuspected).toBe(true);
    expect(result.tier).toMatch(/THROTTLE|CHALLENGE|HOLD_REVIEW/);
    expect(result.flags.some((f) => f.includes("Rapid like burst"))).toBe(true);
  });

  it("detects identical comment spam flooding across distinct posts", () => {
    const baseTime = Date.now();
    const spamEvents: UserActionEvent[] = [
      { userId: "spammer", action: "COMMENT", targetId: "p1", timestamp: baseTime + 1000, metadata: { text: "Follow my telegram @fake123" } },
      { userId: "spammer", action: "COMMENT", targetId: "p2", timestamp: baseTime + 3000, metadata: { text: "Follow my telegram @fake123" } },
      { userId: "spammer", action: "COMMENT", targetId: "p3", timestamp: baseTime + 5000, metadata: { text: "Follow my telegram @fake123" } },
      { userId: "spammer", action: "COMMENT", targetId: "p4", timestamp: baseTime + 7000, metadata: { text: "Follow my telegram @fake123" } },
    ];

    const result = evaluateActionSequence(spamEvents);
    expect(result.heads.ReplySpamBot).toBeGreaterThan(0.6);
    expect(result.flags.some((f) => f.includes("Repeated identical comment"))).toBe(true);
  });

  it("passes legitimate human browsing behavior with high LegitimateUser score", () => {
    const baseTime = Date.now();
    const humanEvents: UserActionEvent[] = [
      { userId: "student_456", action: "VIEW_POST", targetId: "p1", timestamp: baseTime - 60_000, dwellMs: 4500 },
      { userId: "student_456", action: "LIKE", targetId: "p1", timestamp: baseTime - 55_000 },
      { userId: "student_456", action: "VIEW_POST", targetId: "p2", timestamp: baseTime - 40_000, dwellMs: 12000 },
      { userId: "student_456", action: "COMMENT", targetId: "p2", timestamp: baseTime - 25_000, metadata: { text: "What room is the placement test in?" } },
      { userId: "student_456", action: "VIEW_POST", targetId: "p3", timestamp: baseTime - 5_000, dwellMs: 3000 },
    ];

    const result = evaluateActionSequence(humanEvents);
    expect(result.heads.LegitimateUser).toBeGreaterThan(0.7);
    expect(result.isBotSuspected).toBe(false);
    expect(result.tier).toBe("ALLOW");
    expect(result.flags.length).toBe(0);
  });
});
