import { describe, expect, it } from "vitest";
import { type AssertCanCreateCommunityPostOptions, assertCanCreateCommunityPost, CommunityPostAuthError } from "./communities";

function fakeDb(community: Record<string, unknown>) {
  return {
    query: {
      communities: { findFirst: async () => community },
      communityMembers: { findFirst: async () => undefined },
    },
  } as unknown as NonNullable<AssertCanCreateCommunityPostOptions["db"]>;
}

const base = { id: "c1", privacy: "PUBLIC", allowAnonymousPosts: true, creatorId: "owner" };

describe("community verified-only posting", () => {
  it("rejects unverified members with a VERIFY_TO_UNLOCK error", async () => {
    const db = fakeDb({ ...base, verifiedOnlyPosting: true });
    const err = await assertCanCreateCommunityPost("p1", "c1", { db, isVerified: false }).catch((e) => e);
    expect(err).toBeInstanceOf(CommunityPostAuthError);
    expect(err.status).toBe(403);
    expect(err.code).toBe("VERIFY_TO_UNLOCK");
  });

  it("treats an unknown verification status as unverified", async () => {
    const db = fakeDb({ ...base, verifiedOnlyPosting: true });
    await expect(assertCanCreateCommunityPost("p1", "c1", { db })).rejects.toBeInstanceOf(CommunityPostAuthError);
  });

  it("lets verified students post, and everyone post when the setting is off", async () => {
    const on = fakeDb({ ...base, verifiedOnlyPosting: true });
    await expect(assertCanCreateCommunityPost("p1", "c1", { db: on, isVerified: true })).resolves.toMatchObject({
      id: "c1",
    });
    const off = fakeDb({ ...base, verifiedOnlyPosting: false });
    await expect(assertCanCreateCommunityPost("p1", "c1", { db: off, isVerified: false })).resolves.toMatchObject({
      id: "c1",
    });
  });
});
