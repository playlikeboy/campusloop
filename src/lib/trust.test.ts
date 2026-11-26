import { describe, expect, it } from "vitest";
import {
  allowedCapabilities,
  CAPABILITIES,
  canUse,
  classifyEmailDomain,
  defaultMemberAccess,
  isVerifyToUnlockBody,
  parseMemberAccess,
  resolveTrustTier,
  tierAllows,
  verifyToUnlockBody,
} from "./trust";
import { isCollegeVerifiedUser } from "./user-verification";

describe("resolveTrustTier", () => {
  it("treats admins and verified profiles as verified", () => {
    expect(resolveTrustTier({ role: "ADMIN", isCollegeVerified: false })).toBe("verified");
    expect(resolveTrustTier({ role: "STUDENT", isCollegeVerified: true })).toBe("verified");
  });

  it("treats everyone else, and missing profiles, as members", () => {
    expect(resolveTrustTier({ role: "STUDENT", isCollegeVerified: false })).toBe("member");
    expect(resolveTrustTier({ role: "MODERATOR" })).toBe("member");
    expect(resolveTrustTier(null)).toBe("member");
    expect(resolveTrustTier(undefined)).toBe("member");
  });

  it("matches the badge check, which no longer trusts an unconfirmed academic address", () => {
    const unconfirmed = { role: "STUDENT", isCollegeVerified: false, email: "a@iitd.ac.in" };
    expect(isCollegeVerifiedUser(unconfirmed)).toBe(false);
    expect(resolveTrustTier(unconfirmed)).toBe("member");
    expect(isCollegeVerifiedUser({ isCollegeVerified: true })).toBe(true);
  });
});

describe("classifyEmailDomain", () => {
  it("classifies webmail as personal", () => {
    expect(classifyEmailDomain("someone@gmail.com")).toBe("personal");
    expect(classifyEmailDomain("SomeOne@Outlook.com")).toBe("personal");
    expect(classifyEmailDomain("x@yahoo.co.in")).toBe("personal");
  });

  it("classifies academic domains as college", () => {
    expect(classifyEmailDomain("student@iitd.ac.in")).toBe("college");
    expect(classifyEmailDomain("student@cs.stanford.edu")).toBe("college");
  });

  it("classifies other and invalid addresses", () => {
    expect(classifyEmailDomain("ceo@acme.io")).toBe("other");
    expect(classifyEmailDomain("not-an-email")).toBe("invalid");
    expect(classifyEmailDomain("a@localhost")).toBe("invalid");
    expect(classifyEmailDomain(null)).toBe("invalid");
  });
});

describe("capability checks", () => {
  const member = { role: "STUDENT", isCollegeVerified: false };
  const verified = { role: "STUDENT", isCollegeVerified: true };

  it("uses safe defaults for members", () => {
    const d = defaultMemberAccess();
    expect(d.membersCanParticipate).toBe(true);
    for (const cap of ["post", "comment", "vote", "chat_dm", "play", "events_register"] as const) {
      expect(canUse(member, cap, d)).toBe(true);
    }
    for (const cap of ["anonymous_post", "campus_match", "secret_crush", "create_community"] as const) {
      expect(canUse(member, cap, d)).toBe(false);
    }
  });

  it("lets verified students do everything whatever the settings", () => {
    const locked = { ...defaultMemberAccess(), membersCanParticipate: false };
    for (const cap of CAPABILITIES) expect(canUse(verified, cap, locked)).toBe(true);
    expect(allowedCapabilities(verified, locked)).toEqual([...CAPABILITIES]);
  });

  it("makes members read-only when the master switch is off", () => {
    const settings = defaultMemberAccess();
    settings.membersCanParticipate = false;
    for (const cap of CAPABILITIES) expect(tierAllows("member", cap, settings)).toBe(false);
    expect(allowedCapabilities(member, settings)).toEqual([]);
  });

  it("follows each admin toggle", () => {
    const settings = defaultMemberAccess();
    settings.capabilities.post = false;
    settings.capabilities.campus_match = true;
    expect(canUse(member, "post", settings)).toBe(false);
    expect(canUse(member, "campus_match", settings)).toBe(true);
  });

  it("denies a missing profile", () => {
    expect(canUse(null, "post", defaultMemberAccess())).toBe(false);
  });
});

describe("parseMemberAccess", () => {
  it("falls back to defaults on empty or broken JSON", () => {
    expect(parseMemberAccess(null)).toEqual(defaultMemberAccess());
    expect(parseMemberAccess("{not json")).toEqual(defaultMemberAccess());
    expect(parseMemberAccess("42")).toEqual(defaultMemberAccess());
  });

  it("keeps known keys, ignores unknown ones and clamps numbers", () => {
    const parsed = parseMemberAccess(
      JSON.stringify({
        membersCanParticipate: false,
        strictRateLimits: false,
        reviewFirstPosts: 999,
        capabilities: { post: false, hack_the_planet: true, vote: "yes" },
      })
    );
    expect(parsed.membersCanParticipate).toBe(false);
    expect(parsed.strictRateLimits).toBe(false);
    expect(parsed.reviewFirstPosts).toBe(20);
    expect(parsed.capabilities.post).toBe(false);
    expect(parsed.capabilities.vote).toBe(true);
    expect("hack_the_planet" in parsed.capabilities).toBe(false);
    expect(parseMemberAccess(JSON.stringify({ reviewFirstPosts: -3 })).reviewFirstPosts).toBe(0);
  });
});

describe("verify-to-unlock body", () => {
  it("round-trips through the client check", () => {
    const body = verifyToUnlockBody("campus_match");
    expect(body.code).toBe("VERIFY_TO_UNLOCK");
    expect(body.capability).toBe("campus_match");
    expect(isVerifyToUnlockBody(body)).toBe(true);
    expect(isVerifyToUnlockBody({ code: "VERIFY_TO_UNLOCK", capability: "nope" })).toBe(false);
    expect(isVerifyToUnlockBody({ error: "x" })).toBe(false);
  });
});
