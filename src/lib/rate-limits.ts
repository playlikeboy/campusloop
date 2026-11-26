/**
 * Every rate limit for public endpoints, in one place. Enforced by
 * src/middleware.ts for /api/*, /oauth/*, /.well-known/* and /mcp/*, keyed by client IP.
 *
 * Rules are matched top to bottom; the first rule whose prefix and method
 * match wins. `store: "redis"` counts across all Workers (exact, costs one
 * Redis call); `store: "memory"` counts per isolate (approximate, free, used
 * for high-volume reads so the feed stays fast). Without Redis, redis rules
 * fall back to memory.
 */

import type { Capability } from "./trust";

export type MethodScope = "ALL" | "READ" | "WRITE";

export interface RateRule {
  prefix: string;
  methods: MethodScope;
  max: number;
  windowSec: number;
  store: "redis" | "memory";
}

/** Never limited: telemetry beacons, webhooks from payment providers, presence pings. */
export const RATE_LIMIT_EXEMPT = [
  "/api/behavior/track",
  "/api/feed/impressions",
  "/api/webhooks/",
  "/api/presence",
  "/api/notifications/unread-count",
];

export const RATE_LIMITS: RateRule[] = [
  // Authentication and credentials
  { prefix: "/api/merchant/auth/login", methods: "WRITE", max: 10, windowSec: 60, store: "redis" },
  { prefix: "/api/auth/", methods: "ALL", max: 30, windowSec: 60, store: "redis" },

  // Login with CampusLoop (OAuth / OIDC)
  { prefix: "/oauth/token", methods: "ALL", max: 60, windowSec: 60, store: "redis" },
  { prefix: "/oauth/revoke", methods: "ALL", max: 60, windowSec: 60, store: "redis" },
  { prefix: "/oauth/authorize", methods: "ALL", max: 40, windowSec: 60, store: "redis" },
  { prefix: "/oauth/userinfo", methods: "ALL", max: 300, windowSec: 60, store: "memory" },
  { prefix: "/oauth/jwks.json", methods: "ALL", max: 300, windowSec: 60, store: "memory" },
  { prefix: "/.well-known/", methods: "ALL", max: 300, windowSec: 60, store: "memory" },

  // Expensive or abusable endpoints
  { prefix: "/api/verify/", methods: "ALL", max: 10, windowSec: 60, store: "redis" },
  { prefix: "/api/upload", methods: "ALL", max: 30, windowSec: 60, store: "redis" },
  { prefix: "/api/push/test", methods: "WRITE", max: 5, windowSec: 60, store: "redis" },
  { prefix: "/api/files", methods: "WRITE", max: 30, windowSec: 60, store: "redis" },
  { prefix: "/api/college-index-requests", methods: "WRITE", max: 5, windowSec: 600, store: "redis" },
  { prefix: "/api/mcp", methods: "ALL", max: 120, windowSec: 60, store: "redis" },
  { prefix: "/mcp/", methods: "ALL", max: 120, windowSec: 60, store: "redis" },
  { prefix: "/api/search", methods: "READ", max: 120, windowSec: 60, store: "memory" },
  { prefix: "/api/invites", methods: "READ", max: 60, windowSec: 60, store: "memory" },
  { prefix: "/api/gifs", methods: "READ", max: 60, windowSec: 60, store: "memory" },
  { prefix: "/api/unsplash", methods: "READ", max: 60, windowSec: 60, store: "memory" },

  // Content creation and social writes. Budgets are per IP per minute and sit
  // well above human speed while blocking scripted floods (AUDIT.md §1.4).
  { prefix: "/api/colleges", methods: "WRITE", max: 5, windowSec: 600, store: "redis" },
  { prefix: "/api/communities/hub/create", methods: "WRITE", max: 5, windowSec: 600, store: "redis" },
  { prefix: "/api/dating/crush", methods: "WRITE", max: 10, windowSec: 60, store: "redis" },
  { prefix: "/api/dating/swipe", methods: "WRITE", max: 90, windowSec: 60, store: "redis" },
  { prefix: "/api/academics", methods: "WRITE", max: 20, windowSec: 60, store: "redis" },
  { prefix: "/api/articles", methods: "WRITE", max: 30, windowSec: 60, store: "redis" },
  { prefix: "/api/stories", methods: "WRITE", max: 30, windowSec: 60, store: "redis" },
  { prefix: "/api/highlights", methods: "WRITE", max: 30, windowSec: 60, store: "redis" },
  { prefix: "/api/reels", methods: "WRITE", max: 60, windowSec: 60, store: "redis" },
  { prefix: "/api/posts", methods: "WRITE", max: 60, windowSec: 60, store: "redis" },
  { prefix: "/api/chat", methods: "WRITE", max: 60, windowSec: 60, store: "redis" },
  { prefix: "/api/communities", methods: "WRITE", max: 60, windowSec: 60, store: "redis" },
  { prefix: "/api/profile", methods: "WRITE", max: 60, windowSec: 60, store: "redis" },

  // Play: votes are the farmable writes, so they get the tightest budgets.
  { prefix: "/api/play/report", methods: "WRITE", max: 10, windowSec: 60, store: "redis" },
  { prefix: "/api/play/dp/vote", methods: "WRITE", max: 40, windowSec: 60, store: "redis" },
  { prefix: "/api/play/memes", methods: "WRITE", max: 30, windowSec: 60, store: "redis" },
  { prefix: "/api/play/this-or-that", methods: "WRITE", max: 40, windowSec: 60, store: "redis" },
  { prefix: "/api/play/", methods: "WRITE", max: 60, windowSec: 60, store: "redis" },

  // Defaults for every other API route
  { prefix: "/api/", methods: "WRITE", max: 120, windowSec: 60, store: "redis" },
  { prefix: "/api/", methods: "READ", max: 600, windowSec: 60, store: "memory" },
];

const WRITE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isRateLimitedPath(path: string): boolean {
  return (
    path.startsWith("/api/") ||
    path.startsWith("/oauth/") ||
    path.startsWith("/.well-known/") ||
    path.startsWith("/mcp/")
  );
}

export function matchRateRule(path: string, method: string): RateRule | null {
  if (method === "OPTIONS" || method === "HEAD") return null;
  if (RATE_LIMIT_EXEMPT.some((p) => path === p.replace(/\/$/, "") || path.startsWith(p.endsWith("/") ? p : `${p}/`))) return null;
  const write = WRITE.has(method);
  return (
    RATE_LIMITS.find(
      (r) => (path === r.prefix.replace(/\/$/, "") || path.startsWith(r.prefix)) && (r.methods === "ALL" || (r.methods === "WRITE") === write)
    ) ?? null
  );
}

/**
 * Extra per-account budgets for unverified members, on top of the IP rules
 * above. Counted per profile per hour by `requireCapability` in
 * src/lib/trust-server.ts while "Stricter limits for members" is on in
 * /admin/access. Verified students never hit these. Capabilities not listed
 * have no extra budget.
 */
export const MEMBER_HOURLY_LIMITS: Partial<Record<Capability, number>> = {
  post: 8,
  comment: 40,
  vote: 200,
  chat_dm: 40,
  join_community: 20,
  create_community: 1,
  anonymous_post: 3,
  campus_match: 60,
  secret_crush: 3,
  events_create: 2,
  events_register: 20,
  upload_media: 20,
  stories: 6,
  play: 150,
};
