import { describe, expect, it } from "vitest";
import { VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";

describe("article algorithmic ranking & tiering", () => {
  function getArticleTier(institutionId: string | null, viewerId: string) {
    if (institutionId && institutionId !== viewerId && institutionId !== VIEWER_INSTITUTION_SLUG) {
      return 1; // Verified college student
    }
    return 0; // Community / non-college user
  }

  function getTrendingScore(
    upvotes: number,
    views: number,
    hoursAge: number,
    isVerified: boolean
  ) {
    const weight = isVerified ? 1.0 : 0.5;
    const base = upvotes * 4 + views;
    const decay = Math.pow(hoursAge + 2, 1.4);
    return (base * weight) / decay;
  }

  it("prioritizes verified college student articles over non-college articles in feeds", () => {
    const viewerId = "inst_viewer_hub_123";
    const verifiedArticle = {
      id: "art_1",
      institutionId: "inst_iit_delhi_999",
      publishedAt: new Date("2026-10-17T10:00:00Z"),
    };
    const communityArticle = {
      id: "art_2",
      institutionId: viewerId,
      publishedAt: new Date("2026-10-17T11:00:00Z"),
    };
    const nullInstArticle = {
      id: "art_3",
      institutionId: null,
      publishedAt: new Date("2026-10-17T12:00:00Z"),
    };

    expect(getArticleTier(verifiedArticle.institutionId, viewerId)).toBe(1);
    expect(getArticleTier(communityArticle.institutionId, viewerId)).toBe(0);
    expect(getArticleTier(nullInstArticle.institutionId, viewerId)).toBe(0);

    // Sorting by tier DESC, then date DESC ensures verified student articles appear first
    const list = [communityArticle, verifiedArticle, nullInstArticle].sort((a, b) => {
      const tierA = getArticleTier(a.institutionId, viewerId);
      const tierB = getArticleTier(b.institutionId, viewerId);
      if (tierB !== tierA) return tierB - tierA;
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    });

    expect(list[0].id).toBe("art_1");
  });

  it("weights trending velocity so verified college articles rank higher with equal engagement", () => {
    const upvotes = 10;
    const views = 50;
    const hours = 3;

    const verifiedScore = getTrendingScore(upvotes, views, hours, true);
    const communityScore = getTrendingScore(upvotes, views, hours, false);

    expect(verifiedScore).toBeGreaterThan(communityScore);
    expect(communityScore).toBeCloseTo(verifiedScore * 0.5);
  });
});
