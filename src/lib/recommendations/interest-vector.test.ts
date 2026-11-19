import { beforeEach, describe, expect, it, vi } from "vitest";

const postRows = [
  { id: "p_meme", type: "MEME", authorId: "auth_1", communityId: "c_memes", institutionId: "campus_a", hashtags: ["memes"] },
  { id: "p_exam", type: "QUESTION", authorId: null, communityId: null, institutionId: "campus_a", hashtags: ["exams"] },
];
const inserted: unknown[] = [];
const redisSet = vi.fn(async () => "OK");
const invalidate = vi.fn(async () => {});

vi.mock("@/db", () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: async () => postRows }) }),
    insert: () => ({
      values: (v: unknown) => {
        inserted.push(v);
        return Promise.resolve();
      },
    }),
  }),
}));
vi.mock("@/lib/redis", () => ({ getRedis: () => ({ set: redisSet, get: vi.fn(async () => null) }) }));
vi.mock("@/lib/recommendations/viewer-affinity", () => ({ invalidateViewerAffinity: invalidate }));

const {
  buildInterestVector,
  decayWeight,
  EMPTY_INTEREST_VECTOR,
  interestMatch,
  interestsToSignals,
  mergeWithSeed,
  seedInterestVector,
  seedStrength,
} = await import("./interest-vector");

describe("interest vector", () => {
  it("halves a signal every 14 days", () => {
    expect(decayWeight(0)).toBe(1);
    expect(decayWeight(14)).toBeCloseTo(0.5);
    expect(decayWeight(28)).toBeCloseTo(0.25);
  });

  it("normalises each dimension to [-1, 1] and weighs recent signals more", () => {
    const v = buildInterestVector([
      { type: "MEME", hashtags: ["#Memes"], weight: 3, ageDays: 0 },
      { type: "CONFESSION", weight: 3, ageDays: 28 },
      { type: "POLL", weight: -1, ageDays: 0 },
    ]);
    expect(v.types.MEME).toBe(1);
    expect(v.types.CONFESSION).toBeCloseTo(0.25);
    expect(v.types.POLL).toBeLessThan(0);
    expect(v.hashtags.memes).toBe(1);
  });

  it("maps onboarding interests to hashtags and types", () => {
    const v = buildInterestVector(interestsToSignals(["Memes & Banter", "Exam Prep", "Robotics"]));
    expect(v.hashtags.memes).toBeGreaterThan(0);
    expect(v.hashtags.pyq).toBeGreaterThan(0);
    expect(v.hashtags.robotics).toBeGreaterThan(0);
    expect(v.types.MEME).toBeGreaterThan(0);
  });

  it("fades the seed as learned evidence grows", () => {
    expect(seedStrength(0)).toBe(1);
    expect(seedStrength(20)).toBeCloseTo(0.5);
    const seed = { ...buildInterestVector([{ type: "MEME", weight: 2 }]), seedWeight: 1 };
    const cold = mergeWithSeed(EMPTY_INTEREST_VECTOR, seed);
    const warm = mergeWithSeed({ ...EMPTY_INTEREST_VECTOR, evidence: 60 }, seed);
    expect(cold.types.MEME).toBe(1);
    expect(warm.types.MEME).toBeCloseTo(0.25);
  });

  it("never matches anonymous authors", () => {
    const v = buildInterestVector([{ authorId: "auth_1", weight: 3 }]);
    expect(interestMatch(v, { type: "NORMAL", authorId: "auth_1" })).toBeGreaterThan(0);
    expect(interestMatch(v, { type: "NORMAL", authorId: "auth_1", isAnonymous: true })).toBe(0);
  });
});

describe("seedInterestVector (cold start)", () => {
  beforeEach(() => {
    inserted.length = 0;
    redisSet.mockClear();
    invalidate.mockClear();
  });

  it("builds a seed from quiz likes, skips and interests, stores it and drops the affinity cache", async () => {
    const seed = await seedInterestVector("profile_1", {
      likedPostIds: ["p_meme"],
      skippedPostIds: ["p_exam"],
      interests: ["Hostel Life"],
    });
    expect(seed.types.MEME).toBeGreaterThan(0);
    expect(seed.types.QUESTION).toBeLessThan(0);
    expect(seed.authors.auth_1).toBeGreaterThan(0);
    expect(seed.communities.c_memes).toBeGreaterThan(0);
    expect(seed.hashtags.hostel).toBeGreaterThan(0);
    expect(seed.seedWeight).toBe(1);
    expect(redisSet).toHaveBeenCalledWith("feed:interest-seed:v1:profile_1", seed, expect.anything());
    expect(inserted).toHaveLength(1);
    expect(invalidate).toHaveBeenCalledWith("profile_1");
  });

  it("rejects unsafe ids without touching storage", async () => {
    const seed = await seedInterestVector("bad id;", { interests: ["Memes & Banter"] });
    expect(seed).toEqual(EMPTY_INTEREST_VECTOR);
    expect(redisSet).not.toHaveBeenCalled();
  });
});
