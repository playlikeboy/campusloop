import { describe, expect, it } from "vitest";
import { calculateCommentScore, rankAndThreadComments } from "./comments-algorithm";

describe("comments-algorithm", () => {
  it("boosts OP comments above regular comments", () => {
    const postAuthorId = "user_author_123";
    const opComment: any = {
      id: "c1",
      authorId: postAuthorId,
      body: "Thanks for checking out this thread!",
      createdAt: new Date(),
      author: { points: 20 },
    };
    const otherComment: any = {
      id: "c2",
      authorId: "user_other_456",
      body: "Nice post!",
      createdAt: new Date(),
      author: { points: 20 },
    };

    const opScore = calculateCommentScore(opComment, 0, { postAuthorId });
    const otherScore = calculateCommentScore(otherComment, 0, { postAuthorId });

    expect(opScore).toBeGreaterThan(otherScore);
  });

  it("boosts pinned comment unconditionally to the very top", () => {
    const normalComment: any = {
      id: "c1",
      authorId: "u1",
      body: "Super popular comment with tons of engagement",
      likesCount: 250,
      createdAt: new Date(),
      author: { points: 500 },
    };
    const pinnedComment: any = {
      id: "c2",
      authorId: "u2",
      body: "Author announcement / resources link",
      isPinned: true,
      likesCount: 0,
      createdAt: new Date(Date.now() - 1000000),
      author: { points: 10 },
    };

    const pinnedScore = calculateCommentScore(pinnedComment, 0, {});
    const normalScore = calculateCommentScore(normalComment, 10, {});

    expect(pinnedScore).toBeGreaterThan(normalScore);

    const ranked = rankAndThreadComments([normalComment, pinnedComment], { sortMode: "TOP" });
    expect(ranked.topLevelComments[0].id).toBe("c2");

    const latestRanked = rankAndThreadComments([normalComment, pinnedComment], { sortMode: "LATEST" });
    expect(latestRanked.topLevelComments[0].id).toBe("c2");
  });

  it("boosts verified student comments", () => {
    const verifiedComment: any = {
      id: "c1",
      authorId: "u1",
      body: "Great question!",
      createdAt: new Date(),
      author: { points: 200 },
    };
    const rookieComment: any = {
      id: "c2",
      authorId: "u2",
      body: "Great question!",
      createdAt: new Date(),
      author: { points: 10 },
    };

    const vScore = calculateCommentScore(verifiedComment, 0, {});
    const rScore = calculateCommentScore(rookieComment, 0, {});

    expect(vScore).toBeGreaterThan(rScore);
  });

  it("boosts same campus classmates", () => {
    const sameCampusComment: any = {
      id: "c1",
      authorId: "u1",
      body: "See you in lab tomorrow!",
      createdAt: new Date(),
      author: { points: 20, institutionId: "inst_bit_mesra" },
    };
    const otherCampusComment: any = {
      id: "c2",
      authorId: "u2",
      body: "See you in lab tomorrow!",
      createdAt: new Date(),
      author: { points: 20, institutionId: "inst_iit_delhi" },
    };

    const sameScore = calculateCommentScore(sameCampusComment, 0, {
      viewerInstitutionId: "inst_bit_mesra",
    });
    const otherScore = calculateCommentScore(otherCampusComment, 0, {
      viewerInstitutionId: "inst_bit_mesra",
    });

    expect(sameScore).toBeGreaterThan(otherScore);
  });

  it("boosts comments with durable database likes", () => {
    const likedComment: any = {
      id: "c1",
      authorId: "u1",
      body: "Helpful tip for exam",
      likesCount: 15,
      createdAt: new Date(),
      author: { points: 50 },
    };
    const unlikedComment: any = {
      id: "c2",
      authorId: "u2",
      body: "Helpful tip for exam",
      likesCount: 0,
      createdAt: new Date(),
      author: { points: 50 },
    };

    const likedScore = calculateCommentScore(likedComment, 0, {});
    const unlikedScore = calculateCommentScore(unlikedComment, 0, {});

    expect(likedScore).toBeGreaterThan(unlikedScore);
  });

  it("flattens deeply nested comment replies into a strict 2-level hierarchy (Instagram/Threads model)", () => {
    const rootComment: any = {
      id: "root_1",
      parentId: null,
      body: "Root comment",
      createdAt: new Date("2026-01-01T10:00:00Z"),
    };
    const reply1: any = {
      id: "reply_1",
      parentId: "root_1",
      body: "Reply to root",
      createdAt: new Date("2026-01-01T10:05:00Z"),
    };
    const nestedReply2: any = {
      id: "nested_2",
      parentId: "reply_1", // nested reply pointing to reply_1
      body: "Reply to reply_1",
      createdAt: new Date("2026-01-01T10:10:00Z"),
    };

    const result = rankAndThreadComments([rootComment, reply1, nestedReply2]);

    expect(result.topLevelComments).toHaveLength(1);
    expect(result.topLevelComments[0].id).toBe("root_1");

    // Both reply1 and nestedReply2 must be anchored under root_1
    const repliesToRoot = result.repliesMap.get("root_1");
    expect(repliesToRoot).toHaveLength(2);
    expect(repliesToRoot?.map((r) => r.id)).toEqual(["reply_1", "nested_2"]);
  });

  it("sorts correctly in TOP vs LATEST mode", () => {
    const now = Date.now();
    const olderHighEngagement: any = {
      id: "c1",
      authorId: "author_op",
      body: "Author note",
      createdAt: new Date(now - 3600000),
      author: { points: 300 },
    };
    const brandNewLowEngagement: any = {
      id: "c2",
      authorId: "user_rand",
      body: "first",
      createdAt: new Date(now),
      author: { points: 10 },
    };

    const list = [olderHighEngagement, brandNewLowEngagement];

    // TOP mode ranks high engagement/OP first
    const topRanked = rankAndThreadComments(list, {
      postAuthorId: "author_op",
      sortMode: "TOP",
    });
    expect(topRanked.topLevelComments[0].id).toBe("c1");

    // LATEST mode ranks newest first
    const latestRanked = rankAndThreadComments(list, {
      postAuthorId: "author_op",
      sortMode: "LATEST",
    });
    expect(latestRanked.topLevelComments[0].id).toBe("c2");
  });
});
