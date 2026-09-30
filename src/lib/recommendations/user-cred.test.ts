import { describe, expect, it } from "vitest";
import { computeUserCred, type UserCredSignals } from "./user-cred";

describe("UserCred & Agatha Trust Engine", () => {
  it("awards high credibility to verified college students with positive engagement", () => {
    const goodStudent: UserCredSignals = {
      userId: "u1",
      isVerifiedStudent: true,
      loopPoints: 350,
      followerCount: 45,
      followingCount: 30,
      mutualFollowsCount: 15,
      totalLikesReceived: 200,
      totalReportsReceived: 0,
      accountAgeDays: 90,
    };

    const cred = computeUserCred(goodStudent);
    expect(cred.trustScore).toBeGreaterThanOrEqual(80);
    expect(cred.isHighCredibility).toBe(true);
    expect(cred.distributionMultiplier).toBeGreaterThan(1.0);
  });

  it("penalizes and suppresses accounts with high Agatha negative report ratio", () => {
    const toxicAccount: UserCredSignals = {
      userId: "u2",
      isVerifiedStudent: false,
      loopPoints: 10,
      followerCount: 2,
      followingCount: 250,
      mutualFollowsCount: 0,
      totalLikesReceived: 10,
      totalReportsReceived: 15, // 15 reports on 10 likes = 150% Agatha ratio!
      totalBlocksReceived: 5,
      accountAgeDays: 5,
    };

    const cred = computeUserCred(toxicAccount);
    expect(cred.trustScore).toBeLessThan(35);
    expect(cred.isSuppressed).toBe(true);
    expect(cred.distributionMultiplier).toBeLessThan(0.8);
    expect(cred.reasons.some((r) => r.includes("Agatha"))).toBe(true);
  });
});
