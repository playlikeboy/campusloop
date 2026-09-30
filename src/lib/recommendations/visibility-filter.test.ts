import { describe, expect, it } from "vitest";
import { evaluateVisibility, type PostVisibilityContext, type ViewerContext } from "./visibility-filter";

describe("Visibility Filtering (Separation of Ranking from Visibility)", () => {
  const samplePost: PostVisibilityContext = {
    postId: "p123",
    authorId: "author_abc",
    status: "PUBLISHED",
    riskScore: 10,
    reportCount: 0,
    isAnonymous: false,
  };

  it("drops deleted or hidden content unconditionally", () => {
    const deletedPost: PostVisibilityContext = { ...samplePost, status: "DELETED" };
    const decision = evaluateVisibility(deletedPost);
    expect(decision.action).toBe("DROP");
  });

  it("holds pending moderation review posts from public timeline", () => {
    const pendingPost: PostVisibilityContext = { ...samplePost, status: "PENDING_REVIEW" };
    const strangerViewer: ViewerContext = { viewerId: "stranger_1" };
    const decision = evaluateVisibility(pendingPost, strangerViewer);
    expect(decision.action).toBe("HOLD");
  });

  it("drops content from authors blocked by the viewer", () => {
    const viewer: ViewerContext = {
      viewerId: "viewer_1",
      blockedUserIds: new Set(["author_abc"]),
    };
    const decision = evaluateVisibility(samplePost, viewer);
    expect(decision.action).toBe("DROP");
    expect(decision.reason).toContain("blocked");
  });

  it("drops content from authors muted by the viewer", () => {
    const viewer: ViewerContext = {
      viewerId: "viewer_1",
      mutedUserIds: new Set(["author_abc"]),
    };
    const decision = evaluateVisibility(samplePost, viewer);
    expect(decision.action).toBe("DROP");
    expect(decision.reason).toContain("muted");
  });

  it("allows clean posts for unconstrained viewers", () => {
    const viewer: ViewerContext = { viewerId: "viewer_clean" };
    const decision = evaluateVisibility(samplePost, viewer);
    expect(decision.action).toBe("ALLOW");
  });
});
