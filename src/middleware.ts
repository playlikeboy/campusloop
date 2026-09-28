import { type NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

const LEGACY_APP_PREFIX = "/app";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 120;
const RATE_LIMIT_EXEMPT_PREFIXES = [
  "/api/behavior/track",
  "/api/presence",
  "/api/notifications/unread-count",
];

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

  const redis = getRedis();
  if (!redis) return null;

  const key = `rl:v1:${getClientKey(req)}:${req.method}:${req.nextUrl.pathname}`;
  try {
    const count = Number(await redis.incr(key));
    if (count === 1) await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);

    if (count > RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "retry-after": String(RATE_LIMIT_WINDOW_SECONDS),
            "x-ratelimit-limit": String(RATE_LIMIT_MAX_REQUESTS),
            "x-ratelimit-remaining": "0",
          },
        }
      );
    }
  } catch {
    // Fail open when Redis is unavailable; availability of the core app wins.
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml)$).*)",
  ],
};
