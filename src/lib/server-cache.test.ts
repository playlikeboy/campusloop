import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    getAll: () => Array.from(cookieJar, ([name, value]) => ({ name, value })),
  })),
}));
vi.mock("@/db", async () => (await import("@/test/mock-db")).mockDbModule());
vi.mock("@/hexclave/server", () => ({
  hexclaveServerApp: {
    getUser: vi.fn(),
  },
}));
// React `cache` only memoizes inside a server request; tests call through directly.
vi.mock("react", async (orig) => ({
  ...(await orig<typeof import("react")>()),
  cache: <T,>(fn: T) => fn,
}));

import { hexclaveServerApp } from "@/hexclave/server";
import {
  __clearServerCachesForTests,
  getAuthCacheKey,
  getCachedAuthUser,
  sha256Hex,
  toShellProfile,
} from "@/lib/server-cache";

const getUser = hexclaveServerApp.getUser as unknown as ReturnType<typeof vi.fn>;

const sdkUser = {
  id: "user_1",
  primaryEmail: "a@college.edu",
  primaryEmailVerified: true,
  displayName: "A",
  profileImageUrl: null,
  update: () => undefined,
};

describe("server-cache auth key", () => {
  beforeEach(() => {
    cookieJar.clear();
    getUser.mockReset();
    __clearServerCachesForTests();
  });

  it("hashes with SHA-256 hex", async () => {
    const expected = createHash("sha256").update("token-value").digest("hex");
    await expect(sha256Hex("token-value")).resolves.toBe(expected);
  });

  it("keys on the hashed access cookie, never the raw token", async () => {
    cookieJar.set("hexclave-access", '["rt","at"]');
    const key = await getAuthCacheKey({
      get: (n) => (cookieJar.has(n) ? { value: cookieJar.get(n)! } : undefined),
      getAll: () => [...cookieJar.keys()].map((name) => ({ name })),
    });
    expect(key).toEqual({ kind: "key", key: createHash("sha256").update('["rt","at"]').digest("hex") });
  });

  it("returns null without calling Hexclave when no auth cookie is present", async () => {
    await expect(getCachedAuthUser()).resolves.toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("falls through to Hexclave uncached when only a refresh cookie exists", async () => {
    cookieJar.set("hexclave-refresh-proj--default", "rt");
    getUser.mockResolvedValue(sdkUser);
    await getCachedAuthUser();
    await getCachedAuthUser();
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it("caches a signed-in user per access cookie as a plain snapshot", async () => {
    cookieJar.set("hexclave-access", '["rt","at"]');
    getUser.mockResolvedValue(sdkUser);

    const first = await getCachedAuthUser();
    const second = await getCachedAuthUser();

    expect(getUser).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(first).toEqual({
      id: "user_1",
      primaryEmail: "a@college.edu",
      primaryEmailVerified: true,
      displayName: "A",
      profileImageUrl: null,
    });
    expect(first).not.toHaveProperty("update");
  });

  it("does not cache a null user", async () => {
    cookieJar.set("hexclave-access", '["rt","expired"]');
    getUser.mockResolvedValue(null);
    await getCachedAuthUser();
    await getCachedAuthUser();
    expect(getUser).toHaveBeenCalledTimes(2);
  });
});

describe("toShellProfile", () => {
  it("keeps only the chrome fields", () => {
    const full = {
      id: "p1",
      username: "u",
      displayName: "U",
      avatarUrl: null,
      points: 5,
      onboardingCompleted: true,
      feedVisibility: "ALL",
      role: "STUDENT",
      bio: "secret-ish",
      institution: { description: "long" },
    } as unknown as Parameters<typeof toShellProfile>[0];
    const slim = toShellProfile(full);
    expect(Object.keys(slim).sort()).toEqual(
      ["avatarUrl", "displayName", "feedVisibility", "id", "onboardingCompleted", "points", "role", "username"].sort()
    );
    expect(toShellProfile(null)).toBeUndefined();
  });
});
