/**
 * Regression tests for the November 2026 security audit. Each block names the
 * hole it pins shut, so a failing test points straight at what regressed.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

// ─── Anonymous actors in notifications ──────────────────────────────────────
describe("notifications never name an anonymous actor", async () => {
  const { anonymousNotificationType, baseNotificationType, hidesNotificationActor, maskNotificationActor } =
    await import("@/lib/notification-anonymity");
  const { buildPushPayload, buildTitle, defaultBody, buildUrl } = await import("@/lib/notification-copy");
  const { channelForType } = await import("@/lib/notification-preferences");

  it("stores anonymous comments, replies and mentions under ANON_* twins", () => {
    expect(anonymousNotificationType("COMMENT")).toBe("ANON_COMMENT");
    expect(anonymousNotificationType("REPLY")).toBe("ANON_REPLY");
    expect(anonymousNotificationType("MENTION")).toBe("ANON_MENTION");
    expect(anonymousNotificationType("LIKE")).toBe("LIKE");
    expect(baseNotificationType("ANON_REPLY")).toBe("REPLY");
  });

  it("masks both the actor object and the raw actorId (CRUSH_ALERT included)", () => {
    for (const type of ["CRUSH_ALERT", "ANON_COMMENT", "ANON_REPLY", "ANON_MENTION"]) {
      const row = { id: "n1", type, actorId: "prof_real_author", actor: { id: "prof_real_author", displayName: "Asha" } };
      const masked = maskNotificationActor(row);
      expect(masked.actorId).toBeNull();
      expect(JSON.stringify(masked)).not.toContain("prof_real_author");
      expect(JSON.stringify(masked)).not.toContain("Asha");
    }
    const named = { id: "n2", type: "COMMENT", actorId: "prof_a", actor: { id: "prof_a" } };
    expect(maskNotificationActor(named)).toBe(named);
    expect(hidesNotificationActor("COMMENT")).toBe(false);
  });

  it("push copy for anonymous types never carries the actor name or avatar", () => {
    const payload = buildPushPayload({ type: "ANON_COMMENT", actorName: "Asha Real", actorAvatarUrl: "https://x/a.png", referenceId: "p1" });
    expect(JSON.stringify(payload)).not.toContain("Asha");
    expect(payload.icon).toBeNull();
    expect(payload.url).toBe("/post/p1");
    expect(buildTitle("ANON_REPLY", "Asha")).not.toContain("Asha");
    expect(defaultBody("ANON_MENTION", "Asha")).not.toContain("Asha");
    expect(buildUrl("ANON_REPLY", "p9")).toBe("/post/p9");
  });

  it("anonymous types keep the same mute channels as their named twins", () => {
    expect(channelForType("ANON_COMMENT")).toBe(channelForType("COMMENT"));
    expect(channelForType("ANON_MENTION")).toBe("MENTION");
  });

  it("comment and post routes pass the anonymous flag to every notification", () => {
    const comments = read("src/app/api/posts/[id]/comments/route.ts");
    expect(comments.match(/anonymous,\n/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(comments).not.toContain("anon_${profile.id.slice(0, 8)}");
    expect(read("src/app/api/posts/route.ts")).toMatch(/notifyMentions\(\{[^}]*anonymous,/s);
  });
});

// ─── Anonymous rows never carry the author id ───────────────────────────────
describe("sanitizeAnonRow", async () => {
  const { sanitizeAnonRow } = await import("@/lib/anonymity");

  it("clears author and authorId on anonymous posts and comments", () => {
    const row = sanitizeAnonRow({
      isAnonymous: true,
      authorId: "prof_secret",
      author: { id: "prof_secret" },
      comments: [
        { isAnonymous: true, authorId: "prof_c", author: { id: "prof_c" } },
        { isAnonymous: false, authorId: "prof_named", author: { id: "prof_named" } },
      ],
    });
    expect(row.authorId).toBeNull();
    expect(row.author).toBeNull();
    expect(row.comments?.[0].authorId).toBeNull();
    expect(row.comments?.[1].authorId).toBe("prof_named");
  });
});

// ─── Public profile projection ──────────────────────────────────────────────
describe("PUBLIC_PROFILE_COLUMNS", async () => {
  const { PUBLIC_PROFILE_COLUMNS } = await import("@/lib/profile-columns");

  it("excludes the anonymous handle and personal data", () => {
    for (const col of ["anonymousUsername", "email", "dob", "gender", "datingPreferences", "userId"]) {
      expect(PUBLIC_PROFILE_COLUMNS).toHaveProperty(col, false);
    }
  });

  it("is used instead of whole profile rows on public read paths", () => {
    for (const file of [
      "src/app/api/search/route.ts",
      "src/app/api/communities/feed/route.ts",
      "src/app/api/posts/saved/route.ts",
      "src/app/api/highlights/route.ts",
      "src/lib/server-cache.ts",
      "src/lib/recommendations/related-posts.ts",
    ]) {
      expect(read(file), file).not.toMatch(/\b(author|user|creator|uploader): true\b/);
    }
  });
});

// ─── Private community posts ────────────────────────────────────────────────
describe("community post visibility", async () => {
  const { canViewCommunityPost, communityPostVisibleSql } = await import("@/lib/post-visibility");

  it("listing mode shows only PUBLIC communities to non-members", () => {
    const priv = { privacy: "PRIVATE", creatorId: "prof_owner" };
    const unlisted = { privacy: "UNLISTED", creatorId: "prof_owner" };
    expect(canViewCommunityPost({ community: null, viewerProfileId: null, isActiveMember: false })).toBe(true);
    expect(canViewCommunityPost({ community: priv, viewerProfileId: "prof_x", isActiveMember: false })).toBe(false);
    expect(canViewCommunityPost({ community: unlisted, viewerProfileId: "prof_x", isActiveMember: false })).toBe(false);
    expect(canViewCommunityPost({ community: priv, viewerProfileId: "prof_x", isActiveMember: true })).toBe(true);
    expect(canViewCommunityPost({ community: priv, viewerProfileId: "prof_owner", isActiveMember: false })).toBe(true);
    expect(canViewCommunityPost({ community: priv, viewerProfileId: null, isActiveMember: true })).toBe(false);
  });

  it("direct mode lets UNLISTED through but not PRIVATE", () => {
    expect(canViewCommunityPost({ community: { privacy: "UNLISTED" }, viewerProfileId: null, isActiveMember: false, mode: "direct" })).toBe(true);
    expect(canViewCommunityPost({ community: { privacy: "PRIVATE" }, viewerProfileId: null, isActiveMember: false, mode: "direct" })).toBe(false);
  });

  it("builds a parameterised SQL guard (viewer id is bound, never inlined)", () => {
    const { sql: text, params } = new PgDialect().sqlToQuery(communityPostVisibleSql("prof_1' or 1=1 --"));
    expect(text).toContain("'PUBLIC'");
    expect(text).toContain("'ACTIVE'");
    expect(text).not.toContain("prof_1");
    expect(params).toContain("prof_1' or 1=1 --");
    const anon = new PgDialect().sqlToQuery(communityPostVisibleSql(null));
    expect(anon.params).toHaveLength(0);
  });

  it("feed, search, sitemap/RSS and the post page apply it", () => {
    expect(read("src/app/api/feed/route.ts")).toContain("communityPostVisibleSql(profileId)");
    expect(read("src/app/api/search/route.ts")).toContain("communityPostVisibleSql(viewerProfileId)");
    expect(read("src/lib/seo/public-posts.ts")).toContain("communityPostVisibleSql(null)");
    expect(read("src/app/api/posts/[id]/route.ts")).toContain("viewerCanReadPost");
    expect(read("src/app/(app)/(post)/post/[id]/page.tsx")).toContain("viewerCanReadPost");
  });
});

// ─── SSRF / key leaks ───────────────────────────────────────────────────────
describe("outbound URLs from clients are pinned to known hosts", async () => {
  const { isUnsplashDownloadUrl } = await import("@/lib/unsplash");
  const { isAllowedPushEndpoint } = await import("@/lib/web-push");

  it("Unsplash download pings only go to api.unsplash.com over https", () => {
    expect(isUnsplashDownloadUrl("https://api.unsplash.com/photos/abc/download?ixid=1")).toBe(true);
    for (const bad of [
      "https://attacker.example/collect",
      "http://api.unsplash.com/photos/abc/download",
      "https://api.unsplash.com.evil.com/x",
      "https://user:pw@api.unsplash.com/x",
      "https://api.unsplash.com:8443/x",
      "http://169.254.169.254/latest/meta-data",
      "not a url",
    ]) {
      expect(isUnsplashDownloadUrl(bad), bad).toBe(false);
    }
  });

  it("web push only targets real push services", () => {
    for (const ok of [
      "https://fcm.googleapis.com/fcm/send/abc",
      "https://updates.push.services.mozilla.com/wpush/v2/x",
      "https://web.push.apple.com/QGx",
      "https://db5p.notify.windows.com/w/?token=x",
    ]) {
      expect(isAllowedPushEndpoint(ok), ok).toBe(true);
    }
    for (const bad of [
      "http://fcm.googleapis.com/fcm/send/abc",
      "https://evilfcm.googleapis.com.attacker.io/x",
      "https://notfcm.googleapis.com/x",
      "https://127.0.0.1/x",
      "https://internal.service/x",
    ]) {
      expect(isAllowedPushEndpoint(bad), bad).toBe(false);
    }
  });
});

// ─── Rate limits ────────────────────────────────────────────────────────────
describe("MCP service routes are rate limited", async () => {
  const { isRateLimitedPath, matchRateRule } = await import("@/lib/rate-limits");

  it("covers /mcp/* with a redis rule", () => {
    expect(isRateLimitedPath("/mcp/events")).toBe(true);
    expect(matchRateRule("/mcp/articles", "POST")).toMatchObject({ store: "redis", max: 120 });
  });
});

// ─── Source-level guards (no runtime harness for these routes) ──────────────
describe("source guards", () => {
  it("course JSON-LD cannot close its <script> tag", () => {
    const src = read("src/app/(app)/(academics)/courses/[slug]/page.tsx");
    expect(src).toContain("serializeJsonLd(jsonLd)");
    expect(src).not.toContain("JSON.stringify(jsonLd)");
  });

  it("MCP service keys are compared in constant time", () => {
    for (const f of ["events", "articles", "academics"]) {
      const src = read(`src/app/mcp/${f}/route.ts`);
      expect(src).toContain("timingSafeCompare(candidateKey?.trim(), expectedKey)");
      expect(src).not.toContain("candidateKey?.trim() === expectedKey");
    }
  });

  it("event registration updates are scoped to the event", () => {
    expect(read("src/app/api/events/[id]/registrations/[regId]/route.ts")).toContain(
      "eq(eventRegistrations.eventId, event.id)"
    );
  });

  it("refresh-token rotation is an atomic claim", () => {
    const src = read("src/lib/oauth/store.ts");
    expect(src).toMatch(/isNull\(oauthRefreshTokens\.rotatedAt\)/);
    expect(src).toMatch(/eq\(oauthCodes\.clientId, input\.client\.id\)/);
  });

  it("private uploads never take the public media branches", () => {
    const src = read("src/app/api/upload/route.ts");
    expect(src).toContain('if ((isImage || category === "image") && !isPrivate)');
  });
});

// ─── MCP key authentication ─────────────────────────────────────────────────
const findFirstProfile = vi.fn();
const findFirstKey = vi.fn();
vi.mock("@/db", () => ({
  getDb: () => ({
    query: {
      userProfiles: { findFirst: findFirstProfile },
      userMcpKeys: { findFirst: findFirstKey },
    },
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  }),
}));

describe("authenticateMcpKey", async () => {
  const { authenticateMcpKey } = await import("@/lib/mcp/auth");

  beforeEach(() => {
    findFirstProfile.mockReset();
    findFirstKey.mockReset();
    delete process.env.CAMPUSLOOP_MCP_API_KEY;
    delete process.env.MCP_API_KEY;
    delete process.env.MCP_EVENTS_API_KEY;
  });

  it("defaults a key with no stored permissions to read-only", async () => {
    findFirstKey.mockResolvedValue({ id: "k1", userId: "p1", isActive: true, permissions: [] });
    findFirstProfile.mockResolvedValue({ id: "p1", status: "ACTIVE", institutionId: "i1", institution: null });
    const ctx = await authenticateMcpKey("cl_mcp_user_key");
    expect(ctx.permissions).toEqual(["read"]);
  });

  it("rejects keys of suspended or banned students", async () => {
    findFirstKey.mockResolvedValue({ id: "k1", userId: "p1", isActive: true, permissions: ["read", "write"] });
    findFirstProfile.mockResolvedValue({ id: "p1", status: "BANNED", institutionId: "i1", institution: null });
    await expect(authenticateMcpKey("cl_mcp_user_key")).rejects.toThrow(/not active/);
  });

  it("master key never falls back to an arbitrary non-admin profile", async () => {
    process.env.CAMPUSLOOP_MCP_API_KEY = "master-key-0123456789";
    findFirstProfile.mockResolvedValue(undefined);
    findFirstKey.mockResolvedValue(undefined);
    await expect(authenticateMcpKey("master-key-0123456789")).rejects.toThrow(/Invalid MCP API key/);
    expect(findFirstProfile).toHaveBeenCalledTimes(1);
  });
});
