import { describe, expect, it } from "vitest";
import { applyAuthorDiversityReranking, diversityMultiplier } from "./diversity-reranker";
import { buildInterestVector } from "./interest-vector-core";
import {
  audienceMultiplier,
  computeValueScore,
  DEFAULT_TYPE_PRIOR,
  deriveTypePriors,
  EXPLORE_SLOT_EVERY,
  EXPLORE_SLOT_OFFSET,
  freshnessDecay,
  MIN_VALUE_SCORE,
  predictActions,
  rankCandidatesV3,
  REEL_VALUE_WEIGHTS,
  scoreCandidate,
  TEST_SLOT_OFFSET,
  trafficTier,
  type V3Candidate,
  VALUE_WEIGHTS,
  ZERO_COUNTS,
} from "./value-model";

const NOW = Date.parse("2026-11-19T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000);

function post(id: string, over: Partial<V3Candidate> = {}, counts: Partial<typeof ZERO_COUNTS> = {}): V3Candidate {
  return {
    id,
    type: "NORMAL",
    authorId: `author_${id}`,
    institutionId: "campus_a",
    createdAt: hoursAgo(10),
    ...over,
    counts: { ...ZERO_COUNTS, ...counts },
  };
}

describe("Bayesian smoothing", () => {
  it("returns the type prior for a post with no impressions", () => {
    const p = predictActions(ZERO_COUNTS, DEFAULT_TYPE_PRIOR);
    expect(p.pVote).toBeCloseTo(DEFAULT_TYPE_PRIOR.vote);
    expect(p.pSkip).toBeCloseTo(DEFAULT_TYPE_PRIOR.skip);
    expect(p.expectedDwellSec).toBeCloseTo(DEFAULT_TYPE_PRIOR.dwellSec);
  });

  it("moves toward the observed rate as impressions grow", () => {
    const few = predictActions({ ...ZERO_COUNTS, impressions: 2, votes: 2 }, DEFAULT_TYPE_PRIOR);
    const many = predictActions({ ...ZERO_COUNTS, impressions: 2000, votes: 1000 }, DEFAULT_TYPE_PRIOR);
    // 2/2 upvotes must not look like a 100% post.
    expect(few.pVote).toBeLessThan(0.2);
    expect(many.pVote).toBeGreaterThan(0.49);
    expect(many.pVote).toBeLessThan(0.51);
  });

  it("caps expected dwell and learns per-type priors shrunk to the default", () => {
    const p = predictActions({ ...ZERO_COUNTS, impressions: 1000, dwellMsSum: 1000 * 120_000 }, DEFAULT_TYPE_PRIOR);
    expect(p.expectedDwellSec).toBe(30);
    const priors = deriveTypePriors([
      { type: "MEME", impressions: 10, dwellMsSum: 0, longDwell: 0, skips: 10, votes: 10, comments: 0, shares: 0, saves: 0, profileTaps: 0, completions: 0, loops: 0, medianEngage: null },
      { type: "POLL", impressions: 100_000, dwellMsSum: 0, longDwell: 0, skips: 0, votes: 30_000, comments: 0, shares: 0, saves: 0, profileTaps: 0, completions: 0, loops: 0, medianEngage: "0.2" },
    ]);
    expect(priors.DEFAULT).toEqual(DEFAULT_TYPE_PRIOR);
    expect(priors.MEME.vote).toBeLessThan(0.15); // 10 impressions barely move it
    expect(priors.POLL.vote).toBeGreaterThan(0.29);
    expect(priors.POLL.medianEngage).toBe(0.2);
  });
});

describe("value score", () => {
  it("orders V(a) as dwell strongest, then comment > share > vote > save, report hard negative", () => {
    expect(VALUE_WEIGHTS.comment).toBeGreaterThan(VALUE_WEIGHTS.share);
    expect(VALUE_WEIGHTS.share).toBeGreaterThan(VALUE_WEIGHTS.vote);
    expect(VALUE_WEIGHTS.vote).toBeGreaterThan(VALUE_WEIGHTS.save);
    expect(VALUE_WEIGHTS.dwellPerSec * 30).toBeGreaterThan(VALUE_WEIGHTS.comment);
    expect(VALUE_WEIGHTS.report).toBeGreaterThan(VALUE_WEIGHTS.comment * 10);
    expect(REEL_VALUE_WEIGHTS.loop).toBeGreaterThan(REEL_VALUE_WEIGHTS.completion);
    expect(REEL_VALUE_WEIGHTS.completion).toBeGreaterThan(REEL_VALUE_WEIGHTS.comment);
  });

  it("ranks a post people read and discuss above one they scroll past", () => {
    const great = predictActions({ ...ZERO_COUNTS, impressions: 200, dwellMsSum: 200 * 12_000, longDwell: 80, votes: 40, comments: 12, skips: 30 }, DEFAULT_TYPE_PRIOR);
    const average = predictActions(ZERO_COUNTS, DEFAULT_TYPE_PRIOR);
    const skipped = predictActions({ ...ZERO_COUNTS, impressions: 200, dwellMsSum: 200 * 500, skips: 195 }, DEFAULT_TYPE_PRIOR);
    const reported = predictActions({ ...ZERO_COUNTS, impressions: 50, dwellMsSum: 50 * 12_000, votes: 10, reports: 5 }, DEFAULT_TYPE_PRIOR);
    expect(computeValueScore(great)).toBeGreaterThan(computeValueScore(average));
    expect(computeValueScore(average)).toBeGreaterThan(computeValueScore(skipped));
    expect(computeValueScore(skipped)).toBe(MIN_VALUE_SCORE);
    expect(computeValueScore(reported)).toBe(MIN_VALUE_SCORE);
  });

  it("decays with age and scores follows and campus higher", () => {
    expect(freshnessDecay(0)).toBe(1);
    expect(freshnessDecay(24)).toBeLessThan(freshnessDecay(2));
    const ctx = { viewerInstitutionId: "campus_a", now: NOW };
    const base = scoreCandidate(post("x"), ctx).score;
    expect(scoreCandidate(post("x", { follow: "mutual" }), ctx).score).toBeGreaterThan(base);
    expect(scoreCandidate(post("x", { follow: "mutual", isAnonymous: true }), ctx).score).toBeCloseTo(base);
    expect(scoreCandidate(post("x", { viewerVoted: true }), ctx).score).toBeLessThan(base);
  });
});

describe("traffic pools", () => {
  it("promotes winners through tiers and decays losers", () => {
    expect(trafficTier(5, 0.01, 0.08, 3)).toBe("test");
    expect(trafficTier(5, 0.01, 0.08, 72)).toBe("tier1");
    expect(trafficTier(40, 0.2, 0.08, 10)).toBe("tier2");
    expect(trafficTier(400, 0.2, 0.08, 10)).toBe("tier3");
    expect(trafficTier(40, 0.02, 0.08, 10)).toBe("decayed");
  });

  it("limits reach until a post is promoted", () => {
    expect(audienceMultiplier("test", "campus")).toBe(1);
    expect(audienceMultiplier("test", "far")).toBeLessThan(audienceMultiplier("tier2", "far"));
    expect(audienceMultiplier("tier2", "nearby")).toBe(1);
    expect(audienceMultiplier("tier3", "far")).toBe(1);
    expect(audienceMultiplier("decayed", "campus")).toBeLessThan(1);
  });
});

describe("rankCandidatesV3", () => {
  // 20 established, well-performing posts and one brand-new same-campus post.
  const established = Array.from({ length: 20 }, (_, i) =>
    post(`e${i}`, { createdAt: hoursAgo(2 + i * 0.1) }, { impressions: 300, dwellMsSum: 300 * 9000, longDwell: 90, votes: 45, comments: 9 })
  );
  const fresh = post("new", { createdAt: hoursAgo(1) }, { impressions: 3 });
  const ctx = { viewerProfileId: "viewer", viewerInstitutionId: "campus_a", now: NOW };

  it("gives a new same-campus post a guaranteed test-pool slot", () => {
    const ranked = rankCandidatesV3([...established, fresh], ctx, 12);
    expect(ranked.findIndex((c) => c.id === "new")).toBe(TEST_SLOT_OFFSET);
  });

  it("does not hand test slots out to other campuses", () => {
    const farFresh = post("far", { createdAt: hoursAgo(1), institutionId: "campus_z" }, { impressions: 3 });
    const ranked = rankCandidatesV3([...established, farFresh], ctx, 12);
    expect(ranked.slice(0, 12).some((c) => c.id === "far")).toBe(false);
  });

  it("sinks a heavily skipped post", () => {
    const skipped = post("skipped", { createdAt: hoursAgo(1) }, { impressions: 300, dwellMsSum: 300 * 400, skips: 295 });
    const ranked = rankCandidatesV3([...established, skipped], ctx);
    expect(ranked[ranked.length - 1].id).toBe("skipped");
  });

  it("injects an out-of-interest exploration post every 6 slots", () => {
    const interest = buildInterestVector(
      Array.from({ length: 10 }, () => ({ type: "NORMAL", weight: 2 }))
    );
    const meme = post("meme", { type: "MEME", createdAt: hoursAgo(30) }, { impressions: 500, dwellMsSum: 500 * 9000, longDwell: 150, votes: 150, comments: 40 });
    const ranked = rankCandidatesV3([...established, meme], { ...ctx, interest }, EXPLORE_SLOT_EVERY);
    expect(ranked[EXPLORE_SLOT_OFFSET].id).toBe("meme");
  });

  it("puts pinned posts first and buried posts last, deterministically", () => {
    const pinned = post("pinned", { boostTier: 3, createdAt: hoursAgo(200) });
    const buried = post("buried", { boostTier: 0 }, { impressions: 500, votes: 400, dwellMsSum: 500 * 20_000 });
    const input = [...established, pinned, buried];
    const a = rankCandidatesV3(input, ctx);
    const b = rankCandidatesV3([...input].reverse(), ctx);
    expect(a[0].id).toBe("pinned");
    expect(a[a.length - 1].id).toBe("buried");
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it("spreads one author across the page", () => {
    const sameAuthor = established.map((c) => ({ ...c, authorId: "prolific" }));
    const others = Array.from({ length: 5 }, (_, i) => post(`o${i}`, { createdAt: hoursAgo(3) }, { impressions: 300, dwellMsSum: 300 * 7000, longDwell: 60, votes: 30, comments: 5 }));
    const ranked = rankCandidatesV3([...sameAuthor, ...others], { ...ctx, viewerInstitutionId: null }, 6);
    expect(ranked.filter((c) => c.authorId === "prolific").length).toBeLessThan(6);
  });
});

describe("community and hashtag diversity", () => {
  it("is off by default (v2 unchanged) and penalises repeats when enabled", () => {
    const prev = [{ type: "NORMAL", communityId: "c1", hashtags: ["exams"] }];
    const next = { type: "MEME", communityId: "c1", hashtags: ["exams"] };
    expect(diversityMultiplier(next, prev, new Map())).toBe(1);
    expect(
      diversityMultiplier(next, prev, new Map(), { adjacentSameCommunityPenalty: 0.8, recentHashtagPenalty: 0.85 })
    ).toBeCloseTo(0.68);
  });

  it("reorders when the same hashtag would repeat", () => {
    const items = [
      { id: "1", authorId: "a", type: "NORMAL", hashtags: ["fest"], _rankingScore: 100 },
      { id: "2", authorId: "b", type: "MEME", hashtags: ["fest"], _rankingScore: 99 },
      { id: "3", authorId: "c", type: "POLL", hashtags: ["exams"], _rankingScore: 95 },
    ];
    expect(applyAuthorDiversityReranking(items).map((i) => i.id)).toEqual(["1", "2", "3"]);
    expect(applyAuthorDiversityReranking(items, { recentHashtagPenalty: 0.85 }).map((i) => i.id)).toEqual(["1", "3", "2"]);
  });
});

describe("legacy posts", () => {
  it("never predicts an engagement rate above 1 when votes predate impression tracking", () => {
    const p = predictActions({ ...ZERO_COUNTS, impressions: 2, votes: 300 }, DEFAULT_TYPE_PRIOR);
    expect(p.pVote).toBeLessThanOrEqual(1);
    expect(p.pEngage).toBeLessThanOrEqual(1);
    expect(p.pSkip).toBeCloseTo(DEFAULT_TYPE_PRIOR.skip * (20 / 22));
  });
});
