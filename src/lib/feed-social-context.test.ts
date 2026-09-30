import { describe, expect, it } from "vitest";
import {
  aggregatePostActivities,
  loadFollowedPostActivity,
  type ActivityRow,
} from "./feed-social-context";

describe("loadFollowedPostActivity edge cases", () => {
  it("returns empty map when viewerProfileId is missing or null", async () => {
    const resNull = await loadFollowedPostActivity({
      viewerProfileId: null,
      postIds: ["post-1"],
    });
    expect(resNull.size).toBe(0);

    const resEmpty = await loadFollowedPostActivity({
      viewerProfileId: "",
      postIds: ["post-1"],
    });
    expect(resEmpty.size).toBe(0);
  });

  it("returns empty map when postIds is empty", async () => {
    const res = await loadFollowedPostActivity({
      viewerProfileId: "viewer-123",
      postIds: [],
    });
    expect(res.size).toBe(0);
  });
});

describe("aggregatePostActivities", () => {
  it("correctly aggregates a single like", () => {
    const likeRows: ActivityRow[] = [
      {
        postId: "p1",
        actorId: "u1",
        displayName: "Ankit Sharma",
        username: "ankit",
        avatarUrl: "https://example.com/avatar.jpg",
        createdAt: "2026-09-30T10:00:00.000Z",
      },
    ];

    const result = aggregatePostActivities({ likeRows });
    const p1Context = result.get("p1");

    expect(p1Context).toBeDefined();
    expect(p1Context?.totalActors).toBe(1);
    expect(p1Context?.actors).toHaveLength(1);
    expect(p1Context?.actors[0]).toEqual({
      id: "u1",
      username: "ankit",
      displayName: "Ankit Sharma",
      avatarUrl: "https://example.com/avatar.jpg",
      actions: ["LIKE"],
      latestAt: "2026-09-30T10:00:00.000Z",
    });
  });

  it("merges multiple actions by the same actor into a single record", () => {
    const likeRows: ActivityRow[] = [
      {
        postId: "p1",
        actorId: "u1",
        displayName: "Ankit Sharma",
        username: "ankit",
        avatarUrl: null,
        createdAt: "2026-09-30T10:00:00.000Z",
      },
    ];
    const commentRows: ActivityRow[] = [
      {
        postId: "p1",
        actorId: "u1",
        displayName: "Ankit Sharma",
        username: "ankit",
        avatarUrl: null,
        createdAt: "2026-09-30T10:05:00.000Z",
      },
    ];
    const repostRows: ActivityRow[] = [
      {
        postId: "p1",
        actorId: "u1",
        displayName: "Ankit Sharma",
        username: "ankit",
        avatarUrl: null,
        createdAt: "2026-09-30T10:10:00.000Z",
      },
    ];

    const result = aggregatePostActivities({ likeRows, commentRows, repostRows });
    const p1Context = result.get("p1");

    expect(p1Context).toBeDefined();
    expect(p1Context?.totalActors).toBe(1);
    expect(p1Context?.actors).toHaveLength(1);

    const actor = p1Context?.actors[0];
    expect(actor?.actions).toContain("LIKE");
    expect(actor?.actions).toContain("COMMENT");
    expect(actor?.actions).toContain("REPOST");
    expect(actor?.latestAt).toBe("2026-09-30T10:10:00.000Z");
  });

  it("sorts actors by recency descending (most recent first)", () => {
    const likeRows: ActivityRow[] = [
      {
        postId: "p1",
        actorId: "u1",
        displayName: "First User",
        username: "first",
        avatarUrl: null,
        createdAt: "2026-09-30T08:00:00.000Z",
      },
      {
        postId: "p1",
        actorId: "u2",
        displayName: "Latest User",
        username: "latest",
        avatarUrl: null,
        createdAt: "2026-09-30T12:00:00.000Z",
      },
      {
        postId: "p1",
        actorId: "u3",
        displayName: "Middle User",
        username: "middle",
        avatarUrl: null,
        createdAt: "2026-09-30T10:00:00.000Z",
      },
    ];

    const result = aggregatePostActivities({ likeRows });
    const actors = result.get("p1")?.actors || [];

    expect(actors.map((a) => a.username)).toEqual(["latest", "middle", "first"]);
  });

  it("caps visible actors at 3 while reporting accurate totalActors", () => {
    const likeRows: ActivityRow[] = [
      { postId: "p1", actorId: "u1", displayName: "User 1", username: "u1", avatarUrl: null, createdAt: "2026-09-30T01:00:00.000Z" },
      { postId: "p1", actorId: "u2", displayName: "User 2", username: "u2", avatarUrl: null, createdAt: "2026-09-30T02:00:00.000Z" },
      { postId: "p1", actorId: "u3", displayName: "User 3", username: "u3", avatarUrl: null, createdAt: "2026-09-30T03:00:00.000Z" },
      { postId: "p1", actorId: "u4", displayName: "User 4", username: "u4", avatarUrl: null, createdAt: "2026-09-30T04:00:00.000Z" },
      { postId: "p1", actorId: "u5", displayName: "User 5", username: "u5", avatarUrl: null, createdAt: "2026-09-30T05:00:00.000Z" },
    ];

    const result = aggregatePostActivities({ likeRows });
    const p1 = result.get("p1");

    expect(p1?.totalActors).toBe(5);
    expect(p1?.actors).toHaveLength(3);
    expect(p1?.actors.map((a) => a.username)).toEqual(["u5", "u4", "u3"]);
  });

  it("segregates activity across multiple posts", () => {
    const likeRows: ActivityRow[] = [
      { postId: "post-A", actorId: "u1", displayName: "User 1", username: "u1", avatarUrl: null, createdAt: "2026-09-30T01:00:00.000Z" },
      { postId: "post-B", actorId: "u2", displayName: "User 2", username: "u2", avatarUrl: null, createdAt: "2026-09-30T02:00:00.000Z" },
    ];

    const result = aggregatePostActivities({ likeRows });
    expect(result.size).toBe(2);
    expect(result.get("post-A")?.actors[0].username).toBe("u1");
    expect(result.get("post-B")?.actors[0].username).toBe("u2");
  });

  it("gracefully ignores rows with missing post, actor, or username", () => {
    const likeRows: any[] = [
      { postId: null, actorId: "u1", displayName: "U1", username: "u1", avatarUrl: null, createdAt: new Date() },
      { postId: "p1", actorId: null, displayName: "U2", username: "u2", avatarUrl: null, createdAt: new Date() },
      { postId: "p1", actorId: "u3", displayName: "U3", username: null, avatarUrl: null, createdAt: new Date() },
      { postId: "p1", actorId: "u4", displayName: null, username: "u4", avatarUrl: null, createdAt: new Date() },
    ];

    const result = aggregatePostActivities({ likeRows });
    expect(result.size).toBe(0);
  });
});
