import { describe, expect, it } from "vitest";
import { storyClosenessScore, rankAndFilterStories } from "@/lib/stories-ranker";
import { getRankingVariant, twoProportionZ } from "./experiments";
import { mutualConnectionBonus } from "./recommended-users";
import { computeTypeSkipPenalty, pickSkippedAuthors } from "./viewer-affinity";

describe("skip learning", () => {
  it("penalises only types skipped well above the baseline, with enough data", () => {
    const penalty = computeTypeSkipPenalty({
      MEME: { skips: 95, total: 100 },
      POLL: { skips: 50, total: 100 },
      QUESTION: { skips: 3, total: 3 },
    });
    expect(penalty.MEME).toBeGreaterThan(0.5);
    expect(penalty.POLL).toBeUndefined();
    expect(penalty.QUESTION ?? 0).toBeLessThan(0.2);
  });

  it("flags authors only after repeated skips and never engaged ones", () => {
    const stats = new Map([
      ["a1", { skips: 10, total: 10 }],
      ["a2", { skips: 2, total: 2 }],
      ["a3", { skips: 10, total: 10 }],
    ]);
    expect(pickSkippedAuthors(stats, new Set(["a3"]))).toEqual(["a1"]);
  });
});

describe("experiments", () => {
  it("assigns arms deterministically and roughly evenly", () => {
    expect(getRankingVariant("user_1")).toBe(getRankingVariant("user_1"));
    expect(getRankingVariant(null)).toBe("control");
    const arms = Array.from({ length: 2000 }, (_, i) => getRankingVariant(`p_${i}`));
    const share = arms.filter((a) => a === "personalized").length / arms.length;
    expect(share).toBeGreaterThan(0.45);
    expect(share).toBeLessThan(0.55);
  });

  it("two-proportion z is signed and detects large differences", () => {
    expect(twoProportionZ(300, 1000, 200, 1000)).toBeGreaterThan(1.96);
    expect(twoProportionZ(200, 1000, 300, 1000)).toBeLessThan(-1.96);
    expect(twoProportionZ(1, 0, 1, 10)).toBe(0);
  });
});

describe("social ranking", () => {
  it("mutual-connection bonus grows with diminishing returns and caps", () => {
    expect(mutualConnectionBonus(0)).toBe(0);
    expect(mutualConnectionBonus(3)).toBeGreaterThan(mutualConnectionBonus(1));
    expect(mutualConnectionBonus(1000)).toBe(30);
  });

  it("orders story trays by closeness and drops blocked users", () => {
    const now = Date.now();
    const mk = (id: string, userId: string, ageH: number) => ({
      id,
      userId,
      mediaUrl: null,
      text: "hi",
      backgroundColor: null,
      createdAt: new Date(now - ageH * 3_600_000),
      expiresAt: new Date(now + 3_600_000),
      user: { id: userId } as never,
    });
    const groups = rankAndFilterStories({
      viewerProfileId: "me",
      activeStories: [mk("s1", "fresh", 0), mk("s2", "close", 20), mk("s3", "blocked", 0), mk("s4", "me", 5)],
      followingIds: ["fresh", "close", "blocked"],
      friendIds: [],
      engagedAuthorIds: ["close"],
      blockedUserIds: ["blocked"],
      now,
    });
    expect(groups.map((g) => g.user.id)).toEqual(["me", "close", "fresh"]);
    expect(
      storyClosenessScore({ isFriend: true, engagedRank: -1, engagedCount: 0, latestStoryAt: now, now })
    ).toBe(3);
  });
});
