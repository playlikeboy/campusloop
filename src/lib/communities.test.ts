import { describe, expect, it } from "vitest";

describe("Campus Communities Logic & Invariants", () => {
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  it("normalizes and sanitizes community slugs correctly", () => {
    expect(slugify("BIT Mesra Coders")).toBe("bit-mesra-coders");
    expect(slugify("AI & Machine Learning Club!")).toBe("ai-machine-learning-club");
    expect(slugify("  --campus---loop--  ")).toBe("campus-loop");
    expect(slugify("c/web3_developers")).toBe("cweb3-developers");
  });

  it("enforces allowed privacy levels", () => {
    const validPrivacy = new Set(["PUBLIC", "PRIVATE", "UNLISTED"]);
    expect(validPrivacy.has("PUBLIC")).toBe(true);
    expect(validPrivacy.has("PRIVATE")).toBe(true);
    expect(validPrivacy.has("UNLISTED")).toBe(true);
    expect(validPrivacy.has("SECRET")).toBe(false);
  });

  it("validates community name constraints", () => {
    function isValidCommunityName(name: string): boolean {
      const trimmed = name.trim();
      return trimmed.length >= 2 && trimmed.length <= 50;
    }

    expect(isValidCommunityName("AI")).toBe(true);
    expect(isValidCommunityName("A")).toBe(false);
    expect(isValidCommunityName("   ")).toBe(false);
    expect(isValidCommunityName("a".repeat(50))).toBe(true);
    expect(isValidCommunityName("a".repeat(51))).toBe(false);
  });

  it("determines initial membership status based on privacy mode", () => {
    function getInitialStatus(privacy: "PUBLIC" | "PRIVATE" | "UNLISTED"): "ACTIVE" | "PENDING" {
      return privacy === "PRIVATE" ? "PENDING" : "ACTIVE";
    }

    expect(getInitialStatus("PUBLIC")).toBe("ACTIVE");
    expect(getInitialStatus("UNLISTED")).toBe("ACTIVE");
    expect(getInitialStatus("PRIVATE")).toBe("PENDING");
  });

  it("rejects anonymous posting when allowAnonymousPosts is false", () => {
    function validateCommunityPost(
      community: { allowAnonymousPosts: boolean },
      post: { isAnonymous: boolean; type?: string }
    ): { allowed: boolean; error?: string } {
      if (!community.allowAnonymousPosts && (post.isAnonymous || post.type === "CONFESSION")) {
        return {
          allowed: false,
          error: "Anonymous posts and confessions are disabled in this community.",
        };
      }
      return { allowed: true };
    }

    const strictlyIdentifiedClub = { allowAnonymousPosts: false };
    const openCampusForum = { allowAnonymousPosts: true };

    expect(validateCommunityPost(strictlyIdentifiedClub, { isAnonymous: true }).allowed).toBe(false);
    expect(validateCommunityPost(strictlyIdentifiedClub, { isAnonymous: false, type: "CONFESSION" }).allowed).toBe(false);
    expect(validateCommunityPost(strictlyIdentifiedClub, { isAnonymous: false, type: "NORMAL" }).allowed).toBe(true);

    expect(validateCommunityPost(openCampusForum, { isAnonymous: true }).allowed).toBe(true);
    expect(validateCommunityPost(openCampusForum, { isAnonymous: true, type: "CONFESSION" }).allowed).toBe(true);
  });

  it("handles destination feed search queries and resolves c/{slug}", () => {
    function filterCommunityByQuery(
      query: string,
      community: { name: string; slug: string; description?: string; category?: string }
    ): boolean {
      const clean = query.trim().toLowerCase().replace(/^c\//, "").replace(/^#/, "").trim();
      if (!clean) return true;
      return (
        community.name.toLowerCase().includes(clean) ||
        community.slug.toLowerCase().includes(clean) ||
        (community.description || "").toLowerCase().includes(clean) ||
        (community.category || "").toLowerCase().includes(clean)
      );
    }

    const comm = {
      name: "Geek Haven Coding Club",
      slug: "geek-haven",
      description: "Competitive coding and web dev",
      category: "Tech",
    };

    expect(filterCommunityByQuery("c/geek-haven", comm)).toBe(true);
    expect(filterCommunityByQuery("geek", comm)).toBe(true);
    expect(filterCommunityByQuery("#coding", comm)).toBe(true);
    expect(filterCommunityByQuery("tech", comm)).toBe(true);
    expect(filterCommunityByQuery("c/dance", comm)).toBe(false);
  });
});
