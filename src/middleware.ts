import { type NextRequest, NextResponse } from "next/server";
import { isRateLimitedPath, matchRateRule } from "@/lib/rate-limits";
import { getRedis } from "@/lib/redis";

const LEGACY_APP_PREFIX = "/app";
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

/** Applies the rule from src/lib/rate-limits.ts for this path and method. */
async function enforceRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;
  if (!isRateLimitedPath(pathname)) return null;
  const rule = matchRateRule(pathname, req.method);
  if (!rule) return null;

  const key = `rl:v2:${getClientKey(req)}:${rule.prefix}:${rule.methods}`;
  let allowed: boolean | null = null;
  const redis = rule.store === "redis" ? getRedis() : null;
  if (redis) {
    try {
      // One round trip: INCR plus EXPIRE NX (sets the window TTL only when the key has none).
      const [count] = await redis.pipeline().incr(key).expire(key, rule.windowSec, "NX").exec<[number, number]>();
      allowed = Number(count) <= rule.max;
    } catch {
      // Redis error: fall through to the in-memory limiter
    }
  }
  if (allowed === null) allowed = checkMemoryRateLimit(key, rule.max, rule.windowSec);
  if (allowed) return null;

  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: { "retry-after": String(rule.windowSec), "x-ratelimit-limit": String(rule.max), "x-ratelimit-remaining": "0" },
    }
  );
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
  const limited = await enforceRateLimit(req);
  if (limited) return limited;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|xsl|pdf)$).*)",
  ],
};
