import { beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================================
// Mocks for Hexclave and DB
// ============================================================================

const mockUser = { id: "auth_user_1", email: "student@example.edu" };
let mockViewerProfile: any = {
  id: "prof_viewer",
  userId: "auth_user_1",
  username: "testviewer",
  displayName: "Test Viewer",
  role: "STUDENT",
  status: "ACTIVE",
  institutionId: "inst_1",
  points: 10,
};

const mockDbQuery = {
  userProfiles: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  posts: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  comments: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  pollOptions: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  pollVotes: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  commentVotes: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  votes: {
    findMany: vi.fn(),
  },
  communities: {
    findFirst: vi.fn(),
  },
  communityMembers: {
    findFirst: vi.fn(),
  },
  swipes: {
    findFirst: vi.fn(),
  },
  conversations: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  conversationParticipants: {
    findMany: vi.fn(),
  },
  follows: {
    findFirst: vi.fn(),
  },
  anonIdentityVault: {
    findFirst: vi.fn(),
  },
};

const mockDbInsert = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();
const mockDbExecute = vi.fn();
const mockDbSelect = vi.fn();

const mockDb = {
  query: mockDbQuery,
  insert: mockDbInsert,
  update: mockDbUpdate,
  delete: mockDbDelete,
  execute: mockDbExecute,
  select: mockDbSelect,
};

vi.mock("@/db", () => ({
  getDb: () => mockDb,
}));

vi.mock("@/hexclave/server", () => ({
  hexclaveServerApp: {
    getUser: vi.fn(async () => mockUser),
  },
}));

vi.mock("@/lib/viewer", () => ({
  rejectViewerWrite: vi.fn(async () => null),
  isViewerProfile: vi.fn(async () => false),
}));

vi.mock("@/lib/qdrant/indexer", () => ({
  indexPostVector: vi.fn(async () => {}),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(async () => {}),
  notifyMentions: vi.fn(async () => {}),
  cleanNotificationSnippet: vi.fn((text: string) => text),
}));

vi.mock("@/lib/post-notifications", () => ({
  notifyFollowersOfNewPost: vi.fn(async () => {}),
}));

// Import modules under test
import { GET as getPostDetail } from "@/app/api/posts/[id]/route";
import { POST as createPost } from "@/app/api/posts/route";
import { POST as votePoll } from "@/app/api/posts/[id]/poll-vote/route";
import { POST as createComment } from "@/app/api/posts/[id]/comments/route";
import { POST as voteComment } from "@/app/api/posts/[id]/comments/[commentId]/vote/route";
import { POST as swipeDating } from "@/app/api/dating/swipe/route";
import {
  assertCanCreateCommunityPost,
  CommunityPostAuthError,
} from "@/lib/communities";
import { followUser, unfollowUser } from "@/lib/follows";

describe("Content, Social, Feed & Dating Security Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockViewerProfile = {
      id: "prof_viewer",
      userId: "auth_user_1",
      username: "testviewer",
      displayName: "Test Viewer",
      role: "STUDENT",
      status: "ACTIVE",
      institutionId: "inst_1",
      points: 10,
    };
    mockDbQuery.userProfiles.findFirst.mockResolvedValue(mockViewerProfile);
  });

  // ==========================================================================
  // PHASE 4: Post Detail API Data Leak
  // ==========================================================================
  describe("PHASE 4 — Post Detail API Data Leak (GET /api/posts/[id])", () => {
    it("returns 404 when post is DELETED", async () => {
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "post_del",
        status: "DELETED",
      });

      const res = await getPostDetail(
        new Request("http://localhost/api/posts/post_del"),
        { params: Promise.resolve({ id: "post_del" }) }
      );
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Post not found");
    });

    it("returns 404 when post is PENDING_REVIEW and viewer is regular STUDENT", async () => {
      mockViewerProfile.role = "STUDENT";
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "post_pending",
        status: "PENDING_REVIEW",
        authorId: "other_user",
      });

      const res = await getPostDetail(
        new Request("http://localhost/api/posts/post_pending"),
        { params: Promise.resolve({ id: "post_pending" }) }
      );
      expect(res.status).toBe(404);
    });

    it("allows MODERATOR to view PENDING_REVIEW post", async () => {
      mockViewerProfile.role = "MODERATOR";
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "post_pending",
        status: "PENDING_REVIEW",
        authorId: "other_user",
        body: "Under review content",
        type: "NORMAL",
        scope: "CAMPUS",
        institutionId: "inst_1",
      });
      mockDbQuery.votes.findMany.mockResolvedValue([]);
      mockDbQuery.comments.findMany.mockResolvedValue([]);

      const res = await getPostDetail(
        new Request("http://localhost/api/posts/post_pending"),
        { params: Promise.resolve({ id: "post_pending" }) }
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe("post_pending");
    });

    it("never exposes raw votes or voter identities, strips riskScore, and masks anonymous author", async () => {
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "post_anon",
        status: "PUBLISHED",
        isAnonymous: true,
        pseudonym: "PhantomPanda",
        authorId: "secret_author_123",
        riskScore: 42,
        body: "Confession text",
        type: "CONFESSION",
        scope: "CAMPUS",
        institutionId: "inst_1",
        author: {
          id: "secret_author_123",
          username: "realname",
          displayName: "Real Name",
          email: "realname@college.edu",
        },
      });

      // Raw votes in DB
      mockDbQuery.votes.findMany.mockResolvedValue([
        { userId: "prof_viewer", value: 1 },
        { userId: "voter_2", value: 1 },
        { userId: "voter_3", value: -1 },
      ]);

      mockDbQuery.comments.findMany.mockResolvedValue([
        {
          id: "comm_1",
          postId: "post_anon",
          body: "Anon comment",
          isAnonymous: true,
          pseudonym: "GhostRider",
          authorId: "secret_commenter_456",
          author: {
            id: "secret_commenter_456",
            username: "realcommenter",
          },
        },
      ]);

      const res = await getPostDetail(
        new Request("http://localhost/api/posts/post_anon"),
        { params: Promise.resolve({ id: "post_anon" }) }
      );
      expect(res.status).toBe(200);
      const data = await res.json();

      // Ensure raw votes array is NEVER returned
      expect(data.votes).toBeUndefined();
      expect(data.voterIds).toBeUndefined();

      // Ensure calculated aggregates are returned
      expect(data.upvotesCount).toBe(2);
      expect(data.downvotesCount).toBe(1);
      expect(data.votesCount).toBe(1);
      expect(data.userVote).toBe(1);
      expect(data.commentsCount).toBe(1);

      // Ensure riskScore is stripped
      expect(data.riskScore).toBeUndefined();

      // Ensure post anonymous author is stripped
      expect(data.author).toBeNull();
      expect(data.authorId).toBeNull();
      expect(data.pseudonym).toBe("PhantomPanda");

      // Ensure comment anonymous author is stripped
      expect(data.comments[0].author).toBeNull();
      expect(data.comments[0].authorId).toBeNull();
      expect(data.comments[0].pseudonym).toBe("GhostRider");
    });
  });

  // ==========================================================================
  // PHASE 5 & 9: Community Authorization & Post Creation Validation
  // ==========================================================================
  describe("PHASE 5 & 9 — Community Authorization & Post Creation Validation", () => {
    describe("assertCanCreateCommunityPost", () => {
      it("throws 404 when community does not exist", async () => {
        mockDbQuery.communities.findFirst.mockResolvedValue(null);

        await expect(
          assertCanCreateCommunityPost("user_1", "comm_missing")
        ).rejects.toThrow("Community not found");
      });

      it("rejects anonymous posts when allowAnonymousPosts is false", async () => {
        mockDbQuery.communities.findFirst.mockResolvedValue({
          id: "comm_strict",
          privacy: "PUBLIC",
          allowAnonymousPosts: false,
        });

        await expect(
          assertCanCreateCommunityPost("user_1", "comm_strict", {
            isAnonymous: true,
          })
        ).rejects.toThrow("Anonymous posts and confessions are disabled in this community.");
      });

      it("in PRIVATE community: rejects non-members, pending, and banned users", async () => {
        mockDbQuery.communities.findFirst.mockResolvedValue({
          id: "comm_private",
          privacy: "PRIVATE",
          allowAnonymousPosts: true,
          creatorId: "creator_id",
        });

        // Non-member
        mockDbQuery.communityMembers.findFirst.mockResolvedValue(null);
        await expect(
          assertCanCreateCommunityPost("user_1", "comm_private")
        ).rejects.toThrow("Only active members can post in this private community");

        // Pending member
        mockDbQuery.communityMembers.findFirst.mockResolvedValue({
          userId: "user_pending",
          status: "PENDING",
        });
        await expect(
          assertCanCreateCommunityPost("user_pending", "comm_private")
        ).rejects.toThrow("Your membership to this private community is pending approval");

        // Banned member
        mockDbQuery.communityMembers.findFirst.mockResolvedValue({
          userId: "user_banned",
          status: "BANNED",
        });
        await expect(
          assertCanCreateCommunityPost("user_banned", "comm_private")
        ).rejects.toThrow("You are banned from this community");
      });

      it("in PRIVATE community: allows ACTIVE members and creator", async () => {
        mockDbQuery.communities.findFirst.mockResolvedValue({
          id: "comm_private",
          privacy: "PRIVATE",
          allowAnonymousPosts: true,
          creatorId: "creator_id",
        });

        // Creator
        mockDbQuery.communityMembers.findFirst.mockResolvedValue(null);
        const creatorRes = await assertCanCreateCommunityPost(
          "creator_id",
          "comm_private"
        );
        expect(creatorRes.id).toBe("comm_private");

        // Active member
        mockDbQuery.communityMembers.findFirst.mockResolvedValue({
          userId: "user_active",
          status: "ACTIVE",
        });
        const memberRes = await assertCanCreateCommunityPost(
          "user_active",
          "comm_private"
        );
        expect(memberRes.id).toBe("comm_private");
      });
    });

    describe("POST /api/posts Validation", () => {
      it("rejects empty body with 400", async () => {
        const req = new Request("http://localhost/api/posts", {
          method: "POST",
          body: JSON.stringify({ body: "   " }),
        });
        const res = await createPost(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Post body cannot be empty");
      });

      it("rejects body exceeding MAX_POST_CHARS with 400", async () => {
        const req = new Request("http://localhost/api/posts", {
          method: "POST",
          body: JSON.stringify({ body: "a".repeat(2001) }),
        });
        const res = await createPost(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("cannot exceed 2000 characters");
      });

      it("rejects invalid post type not in allowlist with 400", async () => {
        const req = new Request("http://localhost/api/posts", {
          method: "POST",
          body: JSON.stringify({ body: "Hello world", type: "SUPER_SECRET" }),
        });
        const res = await createPost(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("Invalid post type");
      });

      it("rejects invalid post scope not in allowlist with 400", async () => {
        const req = new Request("http://localhost/api/posts", {
          method: "POST",
          body: JSON.stringify({ body: "Hello world", scope: "MARS" }),
        });
        const res = await createPost(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("Invalid post scope");
      });

      it("validates poll options count and requires distinct non-empty choices", async () => {
        // Less than 2 distinct options
        const req1 = new Request("http://localhost/api/posts", {
          method: "POST",
          body: JSON.stringify({
            body: "Poll question",
            type: "POLL",
            options: ["Same", "Same", "   "],
          }),
        });
        const res1 = await createPost(req1);
        expect(res1.status).toBe(400);
        expect((await res1.json()).error).toContain("at least 2 distinct non-empty options");

        // More than 6 options
        const req2 = new Request("http://localhost/api/posts", {
          method: "POST",
          body: JSON.stringify({
            body: "Poll question",
            type: "POLL",
            options: ["1", "2", "3", "4", "5", "6", "7"],
          }),
        });
        const res2 = await createPost(req2);
        expect(res2.status).toBe(400);
        expect((await res2.json()).error).toContain("cannot have more than 6 options");
      });
    });
  });

  // ==========================================================================
  // PHASE 6: Poll Integrity
  // ==========================================================================
  describe("PHASE 6 — Poll Integrity (POST /api/posts/[id]/poll-vote)", () => {
    it("rejects missing optionId with 400", async () => {
      const req = new Request("http://localhost/api/posts/p1/poll-vote", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await votePoll(req, { params: Promise.resolve({ id: "p1" }) });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain("Missing or invalid optionId");
    });

    it("rejects if post not found or not an active published poll", async () => {
      mockDbQuery.posts.findFirst.mockResolvedValue(null);
      const req1 = new Request("http://localhost/api/posts/p1/poll-vote", {
        method: "POST",
        body: JSON.stringify({ optionId: "opt_1" }),
      });
      const res1 = await votePoll(req1, { params: Promise.resolve({ id: "p1" }) });
      expect(res1.status).toBe(404);

      // Post not published
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "p1",
        status: "DELETED",
        type: "POLL",
      });
      const req2 = new Request("http://localhost/api/posts/p1/poll-vote", {
        method: "POST",
        body: JSON.stringify({ optionId: "opt_1" }),
      });
      const res2 = await votePoll(req2, { params: Promise.resolve({ id: "p1" }) });
      expect(res2.status).toBe(400);
      expect((await res2.json()).error).toContain("not currently active");

      // Post not a poll
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "p1",
        status: "PUBLISHED",
        type: "NORMAL",
      });
      const req3 = new Request("http://localhost/api/posts/p1/poll-vote", {
        method: "POST",
        body: JSON.stringify({ optionId: "opt_1" }),
      });
      const res3 = await votePoll(req3, { params: Promise.resolve({ id: "p1" }) });
      expect(res3.status).toBe(400);
      expect((await res3.json()).error).toContain("Post is not a poll");
    });

    it("rejects if optionId does not belong to the requested post", async () => {
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "p1",
        status: "PUBLISHED",
        type: "POLL",
      });
      mockDbQuery.pollOptions.findFirst.mockResolvedValue({
        id: "opt_alien",
        postId: "p2_other_post",
        text: "Alien Option",
      });

      const req = new Request("http://localhost/api/posts/p1/poll-vote", {
        method: "POST",
        body: JSON.stringify({ optionId: "opt_alien" }),
      });
      const res = await votePoll(req, { params: Promise.resolve({ id: "p1" }) });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain("does not belong to this poll");
    });

    it("rejects if user has already voted on this poll", async () => {
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "p1",
        status: "PUBLISHED",
        type: "POLL",
      });
      mockDbQuery.pollOptions.findFirst.mockResolvedValue({
        id: "opt_1",
        postId: "p1",
        text: "Option 1",
      });
      mockDbQuery.pollVotes.findFirst.mockResolvedValue({
        id: "prev_vote",
        postId: "p1",
        userId: "prof_viewer",
      });

      const req = new Request("http://localhost/api/posts/p1/poll-vote", {
        method: "POST",
        body: JSON.stringify({ optionId: "opt_1" }),
      });
      const res = await votePoll(req, { params: Promise.resolve({ id: "p1" }) });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("You have already voted on this poll");
    });

    it("handles concurrent conflict safely via onConflictDoNothing", async () => {
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "p1",
        status: "PUBLISHED",
        type: "POLL",
      });
      mockDbQuery.pollOptions.findFirst.mockResolvedValue({
        id: "opt_1",
        postId: "p1",
        text: "Option 1",
      });
      mockDbQuery.pollVotes.findFirst.mockResolvedValue(null);

      // Simulate conflict returning empty array
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflict });
      mockDbInsert.mockReturnValue({ values: mockValues });

      const req = new Request("http://localhost/api/posts/p1/poll-vote", {
        method: "POST",
        body: JSON.stringify({ optionId: "opt_1" }),
      });
      const res = await votePoll(req, { params: Promise.resolve({ id: "p1" }) });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("You have already voted on this poll");
    });
  });

  // ==========================================================================
  // PHASE 7: Comment Parent Integrity
  // ==========================================================================
  describe("PHASE 7 — Comment Parent Integrity (POST /api/posts/[id]/comments)", () => {
    it("rejects commenting on a DELETED post with 400", async () => {
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "post_del",
        status: "DELETED",
      });

      const req = new Request("http://localhost/api/posts/post_del/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Test comment" }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: "post_del" }) });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Cannot comment on a deleted post");
    });

    it("rejects when parentId does not exist with 404", async () => {
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "post_1",
        status: "PUBLISHED",
      });
      mockDbQuery.comments.findFirst.mockResolvedValue(null);

      const req = new Request("http://localhost/api/posts/post_1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Reply", parentId: "nonexistent_parent" }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: "post_1" }) });
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Parent comment not found");
    });

    it("rejects when parent comment belongs to a different post with 400", async () => {
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "post_1",
        status: "PUBLISHED",
      });
      mockDbQuery.comments.findFirst.mockResolvedValue({
        id: "parent_other",
        postId: "different_post_999",
        status: "PUBLISHED",
      });

      const req = new Request("http://localhost/api/posts/post_1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Reply", parentId: "parent_other" }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: "post_1" }) });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Parent comment does not belong to this post");
    });

    it("rejects when parent comment is DELETED with 400", async () => {
      mockDbQuery.posts.findFirst.mockResolvedValue({
        id: "post_1",
        status: "PUBLISHED",
      });
      mockDbQuery.comments.findFirst.mockResolvedValue({
        id: "parent_dead",
        postId: "post_1",
        status: "DELETED",
      });

      const req = new Request("http://localhost/api/posts/post_1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Reply", parentId: "parent_dead" }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: "post_1" }) });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Cannot reply to a deleted comment");
    });
  });

  // ==========================================================================
  // PHASE 8: Comment Like Concurrency & Idempotency
  // ==========================================================================
  describe("PHASE 8 — Comment Like Concurrency & Idempotency", () => {
    it("rejects voting on DELETED comment with 404", async () => {
      mockDbQuery.comments.findFirst.mockResolvedValue({
        id: "comm_del",
        postId: "p1",
        status: "DELETED",
      });

      const req = new Request("http://localhost/api/posts/p1/comments/comm_del/vote", {
        method: "POST",
      });
      const res = await voteComment(req, {
        params: Promise.resolve({ id: "p1", commentId: "comm_del" }),
      });
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Comment not found");
    });

    it("inserts vote and atomically increments likesCount on first like", async () => {
      mockDbQuery.comments.findFirst.mockResolvedValue({
        id: "comm_1",
        postId: "p1",
        likesCount: 5,
        status: "PUBLISHED",
        authorId: "author_other",
      });
      mockDbQuery.commentVotes.findFirst.mockResolvedValue(null);

      // Insert returns new vote id
      const mockReturning = vi.fn().mockResolvedValue([{ id: "cv_1" }]);
      const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflict });
      mockDbInsert.mockReturnValue({ values: mockValues });

      // Update comment likesCount
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ likesCount: 6 }]),
          }),
        }),
      });

      const req = new Request("http://localhost/api/posts/p1/comments/comm_1/vote", {
        method: "POST",
      });
      const res = await voteComment(req, {
        params: Promise.resolve({ id: "p1", commentId: "comm_1" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.hasLiked).toBe(true);
      expect(json.likesCount).toBe(6);
    });

    it("handles racing concurrent like safely without double counting or double points", async () => {
      mockDbQuery.comments.findFirst.mockResolvedValue({
        id: "comm_1",
        postId: "p1",
        likesCount: 5,
        status: "PUBLISHED",
        authorId: "author_other",
      });
      mockDbQuery.commentVotes.findFirst.mockResolvedValue(null);

      // Simulate onConflictDoNothing returning empty array (already liked in parallel request)
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflict });
      mockDbInsert.mockReturnValue({ values: mockValues });

      const req = new Request("http://localhost/api/posts/p1/comments/comm_1/vote", {
        method: "POST",
      });
      const res = await voteComment(req, {
        params: Promise.resolve({ id: "p1", commentId: "comm_1" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.hasLiked).toBe(true);
      expect(json.likesCount).toBe(5); // Not incremented!
    });
  });

  // ==========================================================================
  // PHASE 17: Dating Swipe Validation
  // ==========================================================================
  describe("PHASE 17 — Dating Swipe Validation (POST /api/dating/swipe)", () => {
    it("rejects missing targetId parameter with 400", async () => {
      const req = new Request("http://localhost/api/dating/swipe", {
        method: "POST",
        body: JSON.stringify({ direction: "LIKE" }),
      });
      const res = await swipeDating(req);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Missing targetId parameter");
    });

    it("rejects self-swipe with 400", async () => {
      const req = new Request("http://localhost/api/dating/swipe", {
        method: "POST",
        body: JSON.stringify({ targetId: "prof_viewer", direction: "LIKE" }),
      });
      const res = await swipeDating(req);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("You cannot swipe on yourself");
    });

    it("rejects target that is not ACTIVE with 400", async () => {
      mockDbQuery.userProfiles.findFirst
        .mockResolvedValueOnce(mockViewerProfile)
        .mockResolvedValueOnce({
          id: "target_banned",
          status: "BANNED",
        });

      const req = new Request("http://localhost/api/dating/swipe", {
        method: "POST",
        body: JSON.stringify({ targetId: "target_banned", direction: "LIKE" }),
      });
      const res = await swipeDating(req);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("Target profile is not active");
    });

    it("rejects unknown direction values with 400 instead of silent fallback", async () => {
      mockDbQuery.userProfiles.findFirst
        .mockResolvedValueOnce(mockViewerProfile)
        .mockResolvedValueOnce({
          id: "target_active",
          status: "ACTIVE",
        });

      const req = new Request("http://localhost/api/dating/swipe", {
        method: "POST",
        body: JSON.stringify({ targetId: "target_active", direction: "SUPER_LIKE" }),
      });
      const res = await swipeDating(req);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain("Direction must be either 'LIKE' or 'PASS'");
    });

    it("idempotently reuses existing conversation thread on mutual match", async () => {
      mockDbQuery.userProfiles.findFirst
        .mockResolvedValueOnce(mockViewerProfile)
        .mockResolvedValueOnce({
          id: "target_active",
          displayName: "Target Match",
          avatarUrl: "https://example.com/pfp.jpg",
          status: "ACTIVE",
        });

      // Swipes upsert mock
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue({}),
        }),
      });

      // Mutual LIKE exists
      mockDbQuery.swipes.findFirst.mockResolvedValue({
        swiperId: "target_active",
        targetId: "prof_viewer",
        direction: "LIKE",
      });

      // Pre-existing conversation between prof_viewer and target_active
      mockDbQuery.conversationParticipants.findMany
        .mockResolvedValueOnce([{ conversationId: "conv_existing" }]) // myConvs
        .mockResolvedValueOnce([{ conversationId: "conv_existing" }]); // targetConvs

      mockDbQuery.conversations.findFirst.mockResolvedValue({
        id: "conv_existing",
        type: "DIRECT",
      });

      const req = new Request("http://localhost/api/dating/swipe", {
        method: "POST",
        body: JSON.stringify({ targetId: "target_active", direction: "LIKE" }),
      });
      const res = await swipeDating(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.matched).toBe(true);
      expect(json.conversationId).toBe("conv_existing");
    });
  });

  // ==========================================================================
  // PHASE 18: Follow System Concurrency
  // ==========================================================================
  describe("PHASE 18 — Follow System Concurrency (src/lib/follows.ts)", () => {
    it("rejects self-follow in followUser", async () => {
      await expect(followUser("user_same", "user_same")).rejects.toThrow(
        "Cannot follow yourself"
      );
    });

    it("safely handles self-unfollow in unfollowUser", async () => {
      const res = await unfollowUser("user_same", "user_same");
      expect(res.isFollowing).toBe(false);
      expect(res.created).toBe(false);
      expect(res.isFriend).toBe(false);
    });

    it("handles followUser idempotently via onConflictDoNothing", async () => {
      // Mock follow insert returning empty array (already following)
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflict });
      mockDbInsert.mockReturnValue({ values: mockValues });

      // Mock execute for mutual edge promotion
      mockDbExecute.mockResolvedValue({ rows: [] });

      // Mock areFriends check
      mockDbQuery.follows.findFirst.mockResolvedValue(null);

      const result = await followUser("follower_1", "following_2");
      expect(result.isFollowing).toBe(true);
      expect(result.created).toBe(false);
      expect(result.isFriend).toBe(false);
    });

    it("handles unfollowUser idempotently when row was already deleted", async () => {
      const mockReturning = vi.fn().mockResolvedValue([]); // 0 rows deleted
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      mockDbDelete.mockReturnValue({ where: mockWhere });

      const result = await unfollowUser("follower_1", "following_2");
      expect(result.isFollowing).toBe(false);
      expect(result.created).toBe(false);
      expect(result.isFriend).toBe(false);
      // Ensure update for demoting mutual friend wasn't invoked needlessly
      expect(mockDbUpdate).not.toHaveBeenCalled();
    });
  });
});
