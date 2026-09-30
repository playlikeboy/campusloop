import { describe, expect, it } from "vitest";
import {
  computePhoenixValueScore,
  DEFAULT_PHOENIX_WEIGHTS,
  getPhoenixValueScoreSql,
} from "./phoenix-ranker";

describe("Phoenix Multi-Action Ranking & Explicit Value Function", () => {
  it("weights conversation (comments) significantly higher than passive likes", () => {
    // 1 comment vs 1 like
    const commentHeavy = computePhoenixValueScore({
      pLike: 0,
      pComment: 1.0,
      pRepost: 0,
      pShare: 0,
      pSave: 0,
      pFollowAuthor: 0,
      pEventRsvp: 0,
      pClubJoin: 0,
      pLongDwell: 0,
    });

    const likeHeavy = computePhoenixValueScore({
      pLike: 1.0,
      pComment: 0,
      pRepost: 0,
      pShare: 0,
      pSave: 0,
      pFollowAuthor: 0,
      pEventRsvp: 0,
      pClubJoin: 0,
      pLongDwell: 0,
    });

    // In X Home Mixer & CampusLoop Phoenix weights, comment is 5.0, like is 0.5 (10x ratio)
    expect(commentHeavy).toBe(DEFAULT_PHOENIX_WEIGHTS.comment);
    expect(likeHeavy).toBe(DEFAULT_PHOENIX_WEIGHTS.like);
    expect(commentHeavy).toBeGreaterThan(likeHeavy * 5);
  });

  it("applies campus utility bonus for event RSVPs and club joins", () => {
    const campusUtilityPost = computePhoenixValueScore({
      pLike: 0.2,
      pComment: 0.1,
      pRepost: 0,
      pShare: 0.1,
      pSave: 0.2,
      pFollowAuthor: 0.1,
      pEventRsvp: 0.8, // High RSVP intent
      pClubJoin: 0.5, // High club join intent
      pLongDwell: 0.3,
    });

    expect(campusUtilityPost).toBeGreaterThan(10.0);
  });

  it("heavily penalizes reports and negative feedback", () => {
    const normalPost = computePhoenixValueScore({
      pLike: 0.8,
      pComment: 0.4,
      pRepost: 0.2,
      pShare: 0.1,
      pSave: 0.2,
      pFollowAuthor: 0.1,
      pEventRsvp: 0,
      pClubJoin: 0,
      pLongDwell: 0.5,
    });

    const reportedPost = computePhoenixValueScore({
      pLike: 0.8,
      pComment: 0.4,
      pRepost: 0.2,
      pShare: 0.1,
      pSave: 0.2,
      pFollowAuthor: 0.1,
      pEventRsvp: 0,
      pClubJoin: 0,
      pLongDwell: 0.5,
      pReport: 0.5, // Flagged by safety
    });

    expect(reportedPost).toBeLessThan(0);
    expect(normalPost).toBeGreaterThan(0);
  });

  it("generates a valid Drizzle SQL expression for PostgreSQL", () => {
    const sqlExpr = getPhoenixValueScoreSql("viewer_123", "inst_bits", ["seen_post_1"]);
    expect(sqlExpr).toBeDefined();
    expect(typeof sqlExpr.toQuery).toBe("function");
  });
});
