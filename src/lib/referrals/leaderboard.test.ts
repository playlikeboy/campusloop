import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", async () =>
  (await import("@/test/mock-db")).mockDbModule({
    selectRows: [
      { username: "riya", displayName: "Riya", avatarUrl: null, invites: 9, college: "BIT Mesra" },
      { username: "arjun", displayName: "Arjun", avatarUrl: null, invites: 9, college: "BIT Mesra" },
      { username: "dev", displayName: "Dev", avatarUrl: null, invites: 2, college: "BIT Mesra" },
    ],
  })
);

import { clampLeaderboardLimit, getInviteLeaderboard, rankLeaders } from "./leaderboard";

describe("clampLeaderboardLimit", () => {
  it("defaults bad input and caps large requests", () => {
    expect(clampLeaderboardLimit(null)).toBe(25);
    expect(clampLeaderboardLimit("abc")).toBe(25);
    expect(clampLeaderboardLimit(-4)).toBe(25);
    expect(clampLeaderboardLimit("10")).toBe(10);
    expect(clampLeaderboardLimit(5000)).toBe(50);
  });
});

describe("rankLeaders", () => {
  it("gives equal invite counts the same rank", () => {
    const ranked = rankLeaders([{ invites: 9 }, { invites: 9 }, { invites: 2 }, { invites: 1 }]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3, 4]);
  });
});

describe("getInviteLeaderboard", () => {
  it("returns ranked rows with only public fields", async () => {
    const leaders = await getInviteLeaderboard({ institutionId: "inst-1" });
    expect(leaders.map((l) => [l.rank, l.username])).toEqual([
      [1, "riya"],
      [1, "arjun"],
      [3, "dev"],
    ]);
    expect(Object.keys(leaders[0]).sort()).toEqual(
      ["avatarUrl", "college", "displayName", "invites", "rank", "username"].sort()
    );
  });
});
