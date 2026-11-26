import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ settingsValue: null as string | null, reads: 0 }));

vi.mock("@/db", () => ({
  getDb: () => ({
    query: {
      platformSettings: {
        findFirst: async () => {
          state.reads += 1;
          return state.settingsValue === null ? undefined : { key: "member_access", value: state.settingsValue };
        },
      },
    },
  }),
}));
vi.mock("@/lib/redis", () => ({ getRedis: () => null }));
vi.mock("@/lib/viewer", () => ({ getViewerInstitutionId: async () => "hub" }));

import { defaultMemberAccess } from "./trust";
import { checkCapability, clearMemberAccessCache, getClientTrust, requireCapability } from "./trust-server";

const member = { id: "p_member", role: "STUDENT", isCollegeVerified: false };
const verified = { id: "p_verified", role: "STUDENT", isCollegeVerified: true };

function setSettings(patch: Partial<ReturnType<typeof defaultMemberAccess>>) {
  state.settingsValue = JSON.stringify({ ...defaultMemberAccess(), ...patch });
  clearMemberAccessCache();
}

describe("requireCapability", () => {
  beforeEach(() => {
    state.settingsValue = null;
    state.reads = 0;
    clearMemberAccessCache();
  });

  it("passes verified students without reading settings", async () => {
    setSettings({ membersCanParticipate: false });
    expect(await requireCapability(verified, "anonymous_post")).toBeNull();
    expect(state.reads).toBe(0);
  });

  it("returns a VERIFY_TO_UNLOCK 403 for a locked capability", async () => {
    const res = await requireCapability(member, "campus_match");
    expect(res?.status).toBe(403);
    expect(await res?.json()).toMatchObject({ code: "VERIFY_TO_UNLOCK", capability: "campus_match" });
  });

  it("allows members while the toggle is on and blocks them when the master switch is off", async () => {
    setSettings({ strictRateLimits: false });
    expect(await requireCapability(member, "post")).toBeNull();
    setSettings({ membersCanParticipate: false });
    expect((await requireCapability(member, "post"))?.status).toBe(403);
  });

  it("caches settings so repeat checks do not hit the database", async () => {
    setSettings({ strictRateLimits: false });
    await checkCapability(member, "post");
    await checkCapability(member, "comment");
    await checkCapability(member, "vote");
    expect(state.reads).toBe(1);
  });

  it("enforces the per-member hourly budget when strict limits are on", async () => {
    setSettings({ strictRateLimits: true });
    const who = { ...member, id: `p_budget_${Date.now()}` };
    const results = [];
    for (let i = 0; i < 9; i++) results.push(await checkCapability(who, "post"));
    expect(results.slice(0, 8).every((r) => r.ok)).toBe(true);
    expect(results[8]).toMatchObject({ ok: false, status: 429, code: "MEMBER_RATE_LIMIT" });
    // A read-only check does not spend budget.
    expect((await checkCapability({ ...member, id: "p_read" }, "post", { countUsage: false })).ok).toBe(true);
  });

  it("rejects a missing profile", async () => {
    expect((await requireCapability(null, "post"))?.status).toBe(403);
  });
});

describe("getClientTrust", () => {
  beforeEach(() => {
    state.settingsValue = null;
    clearMemberAccessCache();
  });

  it("flags Campus Preview hub members and lists only allowed capabilities", async () => {
    const trust = await getClientTrust({ ...member, institutionId: "hub" });
    expect(trust?.tier).toBe("member");
    expect(trust?.inViewerHub).toBe(true);
    expect(trust?.allowed).toContain("post");
    expect(trust?.allowed).not.toContain("campus_match");
  });

  it("returns undefined when signed out", async () => {
    expect(await getClientTrust(null)).toBeUndefined();
  });
});
