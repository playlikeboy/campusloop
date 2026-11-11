import { describe, expect, it } from "vitest";

import { formatPollOptions, normalizeApiFeedSort, sortFeedPosts } from "./feed";
import { getCloutTier, isAutoVerified } from "./gamification";

describe("getCloutTier", () => {
  it("starts everyone at Bronze Rookie", () => {
    expect(getCloutTier(0).tierName).toBe("Bronze Rookie");
  });

  it("crosses tiers at exact boundaries", () => {
    expect(getCloutTier(49).level).toBe(1);
    expect(getCloutTier(50).level).toBe(2);
    expect(getCloutTier(149).level).toBe(2);
    expect(getCloutTier(150).level).toBe(3);
    expect(getCloutTier(500).level).toBe(4);
    expect(getCloutTier(1000).level).toBe(5);
  });

  it("unlocks the blue tick only at Gold Star (150 LP)", () => {
    expect(getCloutTier(149).hasBlueTick).toBe(false);
    expect(getCloutTier(150).hasBlueTick).toBe(true);
  });

  it("matches isAutoVerified", () => {
    for (const points of [0, 100, 149, 150, 400, 900]) {
      expect(isAutoVerified(points)).toBe(points >= 150);
    }
  });
});

type SortablePost = {
  id: string;
  createdAt: Date | string;
  votesCount: number;
  commentsCount: number;
  institutionId: string;
};

function post(overrides: Partial<SortablePost>): SortablePost {
  return {
    id: Math.random().toString(36).slice(2),
    createdAt: new Date("2026-01-01"),
    votesCount: 0,
    commentsCount: 0,
    institutionId: "inst_a",
    ...overrides,
  };
}

const A = post({ id: "a", createdAt: "2026-01-03", votesCount: 5 });
const B = post({ id: "b", createdAt: "2026-01-05", votesCount: 1 });
const C = post({ id: "c", createdAt: "2026-01-04", votesCount: 3, commentsCount: 8 });

describe("sortFeedPosts", () => {
  it("sorts latest by descending creation time", () => {
    const sorted = sortFeedPosts([A, B, C], "latest");
    expect(sorted.map((p) => p.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts top_voted by vote count", () => {
    const sorted = sortFeedPosts([A, B, C], "top_voted");
    expect(sorted[0].id).toBe("a");
  });

  it("weights comments in trending score", () => {
    const sorted = sortFeedPosts([A, B, C], "trending");
    // C: 3 + 8*2 = 19 beats A: 5
    expect(sorted[0].id).toBe("c");
  });

  it("boosts the viewer's campus under for_you", () => {
    const campus = post({ id: "campus", votesCount: 0 });
    const globalHot = post({ id: "hot", institutionId: "inst_z", votesCount: 100 });
    const sorted = sortFeedPosts([globalHot, campus], "for_you", "inst_a");
    expect(sorted[0].id).toBe("campus");
  });

  it("boosts posts from followed students and mutual friends under for_you", () => {
    const strangerPost = post({ id: "stranger", authorId: "user_stranger", votesCount: 20 });
    const friendPost = post({ id: "friend", authorId: "user_friend", votesCount: 0 });
    const followingPost = post({ id: "following", authorId: "user_following", votesCount: 0 });

    const sorted = sortFeedPosts([strangerPost, friendPost, followingPost], "for_you", undefined, {
      followingIds: ["user_following"],
      friendIds: ["user_friend"],
    });

    // Mutual friend is highest, followed by following, then stranger
    expect(sorted[0].id).toBe("friend");
    expect(sorted[1].id).toBe("following");
    expect(sorted[2].id).toBe("stranger");
  });

  it("falls back to for_you for unknown sorts", () => {
    const sortedUnknown = sortFeedPosts([A, B, C], "mystery");
    const sortedDefault = sortFeedPosts([A, B, C], null);
    expect(sortedUnknown.map((p) => p.id)).toEqual(sortedDefault.map((p) => p.id));
  });

  it("does not mutate the input array", () => {
    const input = [A, B, C];
    const snapshot = input.map((p) => p.id);
    sortFeedPosts(input, "top_voted");
    expect(input.map((p) => p.id)).toEqual(snapshot);
  });
});

describe("normalizeApiFeedSort", () => {
  it("accepts known sorts", () => {
    expect(normalizeApiFeedSort("for_you")).toBe("for_you");
    expect(normalizeApiFeedSort("most_discussed")).toBe("most_discussed");
  });

  it("defaults unknown values to latest", () => {
    expect(normalizeApiFeedSort("hacker")).toBe("latest");
    expect(normalizeApiFeedSort(null)).toBe("latest");
  });
});

describe("formatPollOptions", () => {
  it("uses SQL-aggregated counts and the viewer's own pick", () => {
    const result = formatPollOptions(
      [
        { id: "a", text: "Yes", votesCount: "3", userVoted: false },
        { id: "b", text: "No", votesCount: 2, userVoted: true },
      ],
      "viewer"
    );
    expect(result.pollOptions).toEqual([
      { id: "a", text: "Yes", votesCount: 3, userVoted: false },
      { id: "b", text: "No", votesCount: 2, userVoted: true },
    ]);
    expect(result.hasVotedPoll).toBe(true);
    expect(result.totalPollVotes).toBe(5);
  });

  it("matches the raw vote-row shape still used by other callers", () => {
    const aggregated = formatPollOptions(
      [
        { id: "a", text: "Yes", votesCount: 2, userVoted: true },
        { id: "b", text: "No", votesCount: 1, userVoted: false },
      ],
      "viewer"
    );
    const raw = formatPollOptions(
      [
        { id: "a", text: "Yes", votes: [{ userId: "viewer" }, { userId: "x" }] },
        { id: "b", text: "No", votes: [{ userId: "y" }] },
      ],
      "viewer"
    );
    expect(raw).toEqual(aggregated);
  });

  it("never marks a vote for a signed-out viewer and handles non-polls", () => {
    expect(formatPollOptions([{ id: "a", text: "Yes", votesCount: 4, userVoted: true }], null)).toEqual({
      pollOptions: [{ id: "a", text: "Yes", votesCount: 4, userVoted: false }],
      hasVotedPoll: false,
      totalPollVotes: 4,
    });
    expect(formatPollOptions([], "viewer")).toEqual({ pollOptions: [], hasVotedPoll: false, totalPollVotes: 0 });
    expect(formatPollOptions(undefined, "viewer")).toEqual({
      pollOptions: undefined,
      hasVotedPoll: false,
      totalPollVotes: 0,
    });
  });
});
