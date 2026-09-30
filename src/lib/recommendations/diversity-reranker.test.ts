import { describe, expect, it } from "vitest";
import { applyAuthorDiversityReranking } from "./diversity-reranker";

describe("Diversity Reranker (VMRanker / DPP Architecture)", () => {
  it("prevents single-author monopolization in feed", () => {
    // Author A posted 3 times in a row with highest initial scores
    const candidates = [
      { id: "1", authorId: "author_A", type: "NORMAL", _rankingScore: 100 },
      { id: "2", authorId: "author_A", type: "NORMAL", _rankingScore: 98 },
      { id: "3", authorId: "author_A", type: "NORMAL", _rankingScore: 95 },
      { id: "4", authorId: "author_B", type: "NORMAL", _rankingScore: 80 },
      { id: "5", authorId: "author_C", type: "NORMAL", _rankingScore: 75 },
    ];

    const reranked = applyAuthorDiversityReranking(candidates);

    // 1st item should be author_A (score 100)
    expect(reranked[0].id).toBe("1");

    // Because author_A is discounted (98 * 0.70 = 68.6), author_B (80) should jump ahead of author_A's 2nd post!
    expect(reranked[1].id).toBe("4");
    expect(reranked[1].authorId).toBe("author_B");
  });

  it("interleaves different content types to prevent category monotony", () => {
    const candidates = [
      { id: "1", authorId: "author_1", type: "CONFESSION", _rankingScore: 90 },
      { id: "2", authorId: "author_2", type: "CONFESSION", _rankingScore: 89 },
      { id: "3", authorId: "author_3", type: "POLL", _rankingScore: 80 },
    ];

    // With adjacent type penalty, after selecting post 1 (CONFESSION), post 2 gets penalized (89 * 0.85 = 75.65)
    // allowing post 3 (POLL with 80) to be interleaved!
    const reranked = applyAuthorDiversityReranking(candidates);
    expect(reranked[0].type).toBe("CONFESSION");
    expect(reranked[1].type).toBe("POLL");
    expect(reranked[2].type).toBe("CONFESSION");
  });

  it("respects the limit parameter", () => {
    const candidates = [
      { id: "1", authorId: "author_1", _rankingScore: 50 },
      { id: "2", authorId: "author_2", _rankingScore: 40 },
      { id: "3", authorId: "author_3", _rankingScore: 30 },
      { id: "4", authorId: "author_4", _rankingScore: 20 },
    ];

    const reranked = applyAuthorDiversityReranking(candidates, { limit: 2 });
    expect(reranked.length).toBe(2);
  });
});
