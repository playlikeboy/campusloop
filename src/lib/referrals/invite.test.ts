import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/join/route";
import { buildJoinTarget, canCreditInvite, cleanInviteCode, inviteUrl, pickInviter } from "./invite";

describe("cleanInviteCode", () => {
  it("normalises a username", () => {
    expect(cleanInviteCode(" @Riya_01 ")).toBe("riya_01");
  });
  it("rejects anything that cannot be a username", () => {
    for (const bad of ["", "ab", "a b c", "../etc", "x".repeat(31), "<script>", null, undefined]) {
      expect(cleanInviteCode(bad)).toBeNull();
    }
  });
});

describe("pickInviter", () => {
  it("prefers the invite cookie over the generic ref cookie", () => {
    expect(pickInviter("riya", "campaign_x")).toBe("riya");
    expect(pickInviter(undefined, "arjun")).toBe("arjun");
    expect(pickInviter("!!", undefined)).toBeNull();
  });
});

describe("buildJoinTarget", () => {
  it("defaults to sign-up and keeps the college hint and UTM tags", () => {
    const target = buildJoinTarget(
      new URLSearchParams("invite=riya&college=bit-mesra&utm_source=instagram&utm_campaign=reel12&x=1")
    );
    expect(target).toBe("/sign-up?college=bit-mesra&utm_source=instagram&utm_campaign=reel12");
  });
  it("honours sign-in mode and a local return path only", () => {
    const signIn = buildJoinTarget(new URLSearchParams("mode=signin&returnUrl=/events"));
    expect(signIn).toBe("/sign-in?returnTo=%2Fevents");
    expect(buildJoinTarget(new URLSearchParams("returnUrl=//evil.example"))).toBe("/sign-up");
    expect(buildJoinTarget(new URLSearchParams("returnTo=https://evil.example"))).toBe("/sign-up");
  });
});

describe("canCreditInvite", () => {
  const base = {
    inviterUserId: "u1",
    invitedUserId: "u2",
    isVerifiedStudent: true,
    wasAlreadyOnboarded: false,
  };
  it("credits a new verified student once", () => {
    expect(canCreditInvite(base)).toBe(true);
  });
  it("never credits a self-invite, a repeat onboarding, or an unverified account", () => {
    expect(canCreditInvite({ ...base, inviterUserId: "u2" })).toBe(false);
    expect(canCreditInvite({ ...base, wasAlreadyOnboarded: true })).toBe(false);
    expect(canCreditInvite({ ...base, isVerifiedStudent: false })).toBe(false);
    expect(canCreditInvite({ ...base, inviterUserId: null })).toBe(false);
  });
});

describe("inviteUrl", () => {
  it("builds the public link", () => {
    expect(inviteUrl("Riya")).toBe("https://campusloop.space/join?invite=riya");
  });
});

describe("GET /join", () => {
  it("sets the invite cookie and redirects to sign-up", () => {
    const res = GET(new NextRequest("https://campusloop.space/join?invite=Riya&utm_source=instagram"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://campusloop.space/sign-up?utm_source=instagram");
    expect(res.cookies.get("cl_referred_by")?.value).toBe("riya");
  });
  it("accepts ?ref= and sets no cookie for a bad code", () => {
    const viaRef = GET(new NextRequest("https://campusloop.space/join?ref=arjun"));
    expect(viaRef.cookies.get("cl_referred_by")?.value).toBe("arjun");
    const bad = GET(new NextRequest("https://campusloop.space/join?invite=a%20b"));
    expect(bad.cookies.get("cl_referred_by")).toBeUndefined();
    expect(bad.headers.get("location")).toBe("https://campusloop.space/sign-up");
  });
});
