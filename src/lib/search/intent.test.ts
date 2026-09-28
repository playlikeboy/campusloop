import { describe, expect, it } from "vitest";
import { detectSearchIntent } from "./intent";

describe("detectSearchIntent", () => {
  describe("Symbol-prefixed queries", () => {
    it("detects PEOPLE intent for @username queries", () => {
      const intent = detectSearchIntent("@sh20raj");
      expect(intent.primaryType).toBe("PEOPLE");
      expect(intent.badge).toBe("Student Profile");
      expect(intent.suggestedAction).toBe("Search student profile for sh20raj");
      expect(intent.didYouMean).toBeUndefined();
    });

    it("handles @ handles with trailing/leading whitespace and mixed casing", () => {
      const intent = detectSearchIntent("   @CampusAdmin   ");
      expect(intent.primaryType).toBe("PEOPLE");
      expect(intent.badge).toBe("Student Profile");
      expect(intent.suggestedAction).toBe("Search student profile for CampusAdmin");
    });

    it("detects HASHTAGS intent for #tag queries", () => {
      const intent = detectSearchIntent("#hackathon");
      expect(intent.primaryType).toBe("HASHTAGS");
      expect(intent.badge).toBe("Trending Hashtag");
      expect(intent.suggestedAction).toBe("Explore tag #hackathon");
      expect(intent.didYouMean).toBeUndefined();
    });

    it("handles hashtags with whitespace and camelCase", () => {
      const intent = detectSearchIntent("  #CampusLife2026  ");
      expect(intent.primaryType).toBe("HASHTAGS");
      expect(intent.badge).toBe("Trending Hashtag");
      expect(intent.suggestedAction).toBe("Explore tag #CampusLife2026");
    });
  });

  describe("Keyword-based intent classification", () => {
    it("detects ACADEMICS intent for course codes and notes queries", () => {
      const intent = detectSearchIntent("CS301 notes");
      expect(intent.primaryType).toBe("ACADEMICS");
      expect(intent.badge).toBe("Academic Vault");
      expect(intent.suggestedAction).toBe("Search study notes, PYQs and syllabus");
    });

    it("detects ACADEMICS intent for exam and syllabus variations", () => {
      expect(detectSearchIntent("previous year pyqs").primaryType).toBe("ACADEMICS");
      expect(detectSearchIntent("midsem syllabus").primaryType).toBe("ACADEMICS");
      expect(detectSearchIntent("maths formula cheat sheet").primaryType).toBe("ACADEMICS");
      expect(detectSearchIntent("ec101 lab manual").primaryType).toBe("ACADEMICS");
      expect(detectSearchIntent("me201 slides").primaryType).toBe("ACADEMICS");
    });

    it("detects EVENTS intent for hackathon and fest queries", () => {
      const intent = detectSearchIntent("hackathon");
      expect(intent.primaryType).toBe("EVENTS");
      expect(intent.badge).toBe("Campus Events");
      expect(intent.suggestedAction).toBe("Explore campus hackathons and fests");
    });

    it("detects EVENTS intent for workshops and competitions", () => {
      expect(detectSearchIntent("cultural fest 2026").primaryType).toBe("EVENTS");
      expect(detectSearchIntent("web dev workshop").primaryType).toBe("EVENTS");
      expect(detectSearchIntent("robotics competition registration").primaryType).toBe("EVENTS");
      expect(detectSearchIntent("ai meetup").primaryType).toBe("EVENTS");
    });

    it("detects MARKETPLACE intent for campus food and store queries", () => {
      const intent = detectSearchIntent("night canteen");
      expect(intent.primaryType).toBe("MARKETPLACE");
      expect(intent.badge).toBe("Campus Stores");
      expect(intent.suggestedAction).toBe("Browse campus shops, canteens and rentals");
    });

    it("detects MARKETPLACE intent for campus rentals and shops", () => {
      expect(detectSearchIntent("cycle rental").primaryType).toBe("MARKETPLACE");
      expect(detectSearchIntent("hostel mess food").primaryType).toBe("MARKETPLACE");
      expect(detectSearchIntent("campus laundry service").primaryType).toBe("MARKETPLACE");
      expect(detectSearchIntent("maggi and rolls").primaryType).toBe("MARKETPLACE");
    });

    it("detects COMMUNITIES intent for student clubs and chapters", () => {
      const intent = detectSearchIntent("gdsc club");
      expect(intent.primaryType).toBe("COMMUNITIES");
      expect(intent.badge).toBe("Clubs & Communities");
      expect(intent.suggestedAction).toBe("Find student clubs and chapters");

      expect(detectSearchIntent("ieee student chapter").primaryType).toBe("COMMUNITIES");
      expect(detectSearchIntent("robotics society").primaryType).toBe("COMMUNITIES");
      expect(detectSearchIntent("acm chapter").primaryType).toBe("COMMUNITIES");
    });

    it("detects ARTICLES intent for placement prep and roadmaps", () => {
      const intent = detectSearchIntent("placement prep roadmap");
      expect(intent.primaryType).toBe("ARTICLES");
      expect(intent.badge).toBe("Articles & Reads");
      expect(intent.suggestedAction).toBe("Read placement roadmaps and student articles");

      expect(detectSearchIntent("software engineer interview experience").primaryType).toBe("ARTICLES");
      expect(detectSearchIntent("how to get an internship").primaryType).toBe("ARTICLES");
    });

    it("detects COLLEGES intent for universities and institutes", () => {
      const intent = detectSearchIntent("iit bombay");
      expect(intent.primaryType).toBe("COLLEGES");
      expect(intent.badge).toBe("Colleges Directory");
      expect(intent.suggestedAction).toBe("Search Indian universities and college hubs");

      expect(detectSearchIntent("nit trichy campus").primaryType).toBe("COLLEGES");
      expect(detectSearchIntent("delhi university").primaryType).toBe("COLLEGES");
      expect(detectSearchIntent("bits pilani").primaryType).toBe("COLLEGES");
    });

    it("falls back to ALL for ambiguous or generic queries", () => {
      const intent = detectSearchIntent("random general keyword");
      expect(intent.primaryType).toBe("ALL");
      expect(intent.badge).toBeUndefined();
      expect(intent.suggestedAction).toBeUndefined();
      expect(intent.didYouMean).toBeUndefined();
    });

    it("handles empty or whitespace-only queries", () => {
      const intent = detectSearchIntent("   ");
      expect(intent.primaryType).toBe("ALL");
      expect(intent.didYouMean).toBeUndefined();
    });
  });

  describe("Typo detection and 'didYouMean' suggestions", () => {
    it("suggests didYouMean correction for typo 'hackthon' -> 'hackathon'", () => {
      const intent = detectSearchIntent("hackthon");
      expect(intent.didYouMean).toBe("hackathon");
    });

    it("corrects multi-word typo queries", () => {
      const intent = detectSearchIntent("colleg festt");
      expect(intent.didYouMean).toBe("college fest");
    });

    it("corrects common academic and campus typos", () => {
      expect(detectSearchIntent("internshp").didYouMean).toBe("internship");
      expect(detectSearchIntent("placment").didYouMean).toBe("placement");
      expect(detectSearchIntent("confesion").didYouMean).toBe("confession");
      expect(detectSearchIntent("comunity").didYouMean).toBe("community");
      expect(detectSearchIntent("cancanteen").didYouMean).toBe("canteen");
      expect(detectSearchIntent("cantene").didYouMean).toBe("canteen");
      expect(detectSearchIntent("acadmics").didYouMean).toBe("academics");
      expect(detectSearchIntent("sylabus").didYouMean).toBe("syllabus");
      expect(detectSearchIntent("hostle").didYouMean).toBe("hostel");
    });

    it("does not suggest didYouMean when words are spelled correctly", () => {
      expect(detectSearchIntent("hackathon").didYouMean).toBeUndefined();
      expect(detectSearchIntent("college fest").didYouMean).toBeUndefined();
      expect(detectSearchIntent("notes").didYouMean).toBeUndefined();
      expect(detectSearchIntent("canteen").didYouMean).toBeUndefined();
    });

    it("preserves symbol prefixes while checking typos if applicable", () => {
      const intent = detectSearchIntent("@sh20raj");
      expect(intent.didYouMean).toBeUndefined();
    });
  });
});
