import { type NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

const LEGACY_APP_PREFIX = "/app";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 120;
const RATE_LIMIT_EXEMPT_PREFIXES = [
  "/api/behavior/track",
  "/api/feed/impressions",
  "/api/webhooks/",
  "/api/presence",
  "/api/notifications/unread-count",
];

const SENSITIVE_AUTH_PREFIXES = ["/api/merchant/auth/login"];
const SENSITIVE_AUTH_MAX_REQUESTS = 10;
const SENSITIVE_AUTH_WINDOW_SECONDS = 60;

// Lightweight in-memory fallback rate limiter when Redis is unconfigured or degraded
const memoryRateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkMemoryRateLimit(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now();
  const entry = memoryRateLimitMap.get(key);

  // Periodic pruning of expired entries
  if (memoryRateLimitMap.size > 2000) {
    for (const [k, v] of memoryRateLimitMap.entries()) {
      if (v.expiresAt <= now) memoryRateLimitMap.delete(k);
    }
  }

  if (!entry || entry.expiresAt <= now) {
    memoryRateLimitMap.set(key, { count: 1, expiresAt: now + windowSec * 1000 });
    return true;
  }

  entry.count++;
  return entry.count <= limit;
}

function getClientKey(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function getLegacyAppDestination(pathname: string): string {
  if (pathname === LEGACY_APP_PREFIX || pathname === `${LEGACY_APP_PREFIX}/`) return "/feeds";
  const rest = pathname.slice(LEGACY_APP_PREFIX.length);
  if (!rest || rest === "/") return "/feeds";
  if (rest === "/chats" || rest.startsWith("/chats/")) return `/chat${rest.slice("/chats".length)}`;
  if (rest === "/discover" || rest.startsWith("/discover/")) return `/explore${rest.slice("/discover".length)}`;
  if (rest === "/search" || rest.startsWith("/search/")) return `/explore${rest.slice("/search".length)}`;
  return rest;
}

async function enforceMutationRateLimit(req: NextRequest): Promise<NextResponse | null> {
  if (!MUTATING_METHODS.has(req.method) || !req.nextUrl.pathname.startsWith("/api/")) return null;
  if (
    RATE_LIMIT_EXEMPT_PREFIXES.some(
      (prefix) => req.nextUrl.pathname === prefix || req.nextUrl.pathname.startsWith(`${prefix}/`)
    )
  )
    return null;

  const isSensitiveAuth = SENSITIVE_AUTH_PREFIXES.some(
    (prefix) => req.nextUrl.pathname === prefix || req.nextUrl.pathname.startsWith(`${prefix}/`)
  );
  const maxRequests = isSensitiveAuth ? SENSITIVE_AUTH_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS;
  const windowSeconds = isSensitiveAuth ? SENSITIVE_AUTH_WINDOW_SECONDS : RATE_LIMIT_WINDOW_SECONDS;

  const clientKey = getClientKey(req);
  const key = `rl:v1:${clientKey}:${req.method}:${req.nextUrl.pathname}`;

  const redis = getRedis();
  if (redis) {
    try {
      const count = Number(await redis.incr(key));
      if (count === 1) await redis.expire(key, windowSeconds);

      if (count > maxRequests) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down." },
          {
            status: 429,
            headers: {
              "retry-after": String(windowSeconds),
              "x-ratelimit-limit": String(maxRequests),
              "x-ratelimit-remaining": "0",
            },
          }
        );
      }
      return null;
    } catch {
      // Redis error: fall through to in-memory limiter
    }
  }

  // In-memory fallback
  const isAllowed = checkMemoryRateLimit(key, maxRequests, windowSeconds);
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "retry-after": String(windowSeconds),
          "x-ratelimit-limit": String(maxRequests),
          "x-ratelimit-remaining": "0",
        },
      }
    );
  }

  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Legacy compatibility only: old /app/* URLs now resolve to their canonical clean route.
  if (pathname === LEGACY_APP_PREFIX || pathname.startsWith(`${LEGACY_APP_PREFIX}/`)) {
    const url = req.nextUrl.clone();
    url.pathname = getLegacyAppDestination(pathname);
    return NextResponse.redirect(url, 308);
  }

  // No clean-route -> /app rewrites. The route tree itself owns canonical URLs.
  const limited = await enforceMutationRateLimit(req);
  if (limited) return limited;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|xsl|pdf)$).*)",
  ],
};
