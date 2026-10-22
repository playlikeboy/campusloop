/**
 * Every rate limit for public endpoints, in one place. Enforced by
 * src/middleware.ts for /api/*, /oauth/* and /.well-known/*, keyed by client IP.
 *
 * Rules are matched top to bottom; the first rule whose prefix and method
 * match wins. `store: "redis"` counts across all Workers (exact, costs one
 * Redis call); `store: "memory"` counts per isolate (approximate, free, used
 * for high-volume reads so the feed stays fast). Without Redis, redis rules
 * fall back to memory.
 */

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
  { prefix: "/api/ai", methods: "ALL", max: 20, windowSec: 60, store: "redis" },
  { prefix: "/api/atlas", methods: "ALL", max: 30, windowSec: 60, store: "redis" },
  { prefix: "/api/upload", methods: "ALL", max: 30, windowSec: 60, store: "redis" },
  { prefix: "/api/files", methods: "WRITE", max: 30, windowSec: 60, store: "redis" },
  { prefix: "/api/payments", methods: "ALL", max: 30, windowSec: 60, store: "redis" },
  { prefix: "/api/college-index-requests", methods: "WRITE", max: 5, windowSec: 600, store: "redis" },
  { prefix: "/api/mcp", methods: "ALL", max: 120, windowSec: 60, store: "redis" },
  { prefix: "/api/search", methods: "READ", max: 120, windowSec: 60, store: "memory" },
  { prefix: "/api/gifs", methods: "READ", max: 60, windowSec: 60, store: "memory" },
  { prefix: "/api/unsplash", methods: "READ", max: 60, windowSec: 60, store: "memory" },

  // Defaults for every other API route
  { prefix: "/api/", methods: "WRITE", max: 120, windowSec: 60, store: "redis" },
  { prefix: "/api/", methods: "READ", max: 600, windowSec: 60, store: "memory" },
];

const WRITE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isRateLimitedPath(path: string): boolean {
  return path.startsWith("/api/") || path.startsWith("/oauth/") || path.startsWith("/.well-known/");
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
