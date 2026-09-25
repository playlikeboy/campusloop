import { type NextRequest, NextResponse } from "next/server";

/**
 * Public mirrors for signed-out visitors and search crawlers.
 *
 * Everything under `/app` sits behind an auth gate that redirects to sign-in.
 * That is right for the feed and for anything interactive, but it also made our
 * most linkable, most rankable pages — campus hubs, articles, events — invisible
 * to Google and to anyone opening a shared link in a private window.
 *
 * Those pages already have public equivalents outside the gated layout. This
 * middleware sends signed-out traffic there instead of to the sign-in wall.
 */

const PUBLIC_MIRRORS: Array<{ gated: string; publicPath: string }> = [
  { gated: "/app/articles/", publicPath: "/a/" },
  { gated: "/app/events/", publicPath: "/e/" },
];

const AUTH_COOKIE_HINTS = ["hexclave-access", "hexclave-refresh", "stack-access", "stack-refresh"];

function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies
    .getAll()
    .some((cookie) => AUTH_COOKIE_HINTS.some((hint) => cookie.name.startsWith(hint)));
}

/**
 * Top-level paths that should NOT be rewritten to `/app/...` on campsy.app
 */
const EXEMPT_PREFIXES = [
  "/api",
  "/handler",
  "/_next",
  "/admin",
  "/admin-login",
  "/merchant-portal",
  "/about",
  "/terms",
  "/privacy",
  "/safety",
  "/contact",
  "/pitch",
  "/sign-in",
  "/sign-up",
  "/logout",
  "/demo",
  "/join",
  "/docs",
  "/aspirants",
  "/sitemaps",
  "/sitemap.xml",
  "/feed.xml",
  "/robots.txt",
  "/favicon.ico",
  "/icons",
  "/images",
  "/sw.js",
  "/manifest.json",
  "/manifest-merchant.json",
  "/a/",
  "/e/",
  "/s/",
  "/c/",
  "/@",
];

export function middleware(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.host ||
    "";
  const hostname = host.split(":")[0].toLowerCase();
  const { pathname, search } = req.nextUrl;

  const isCampsy = hostname === "campsy.app" || hostname === "www.campsy.app";
  const isCampusLoop =
    hostname === "campusloop.space" ||
    hostname === "www.campusloop.space" ||
    hostname.endsWith(".campusloop.space");

  // 1. Domain matching: campusloop.space/app/* -> campsy.app/*
  if (isCampusLoop && (pathname === "/app" || pathname.startsWith("/app/"))) {
    const subpath = pathname === "/app" || pathname === "/app/" ? "/" : pathname.slice(4);
    const destination = `https://campsy.app${subpath}${search}`;
    return NextResponse.redirect(new URL(destination), 308);
  }

  // 2. Routing on campsy.app
  if (isCampsy) {
    // If request explicitly includes /app prefix, redirect to clean URL
    if (pathname === "/app" || pathname === "/app/") {
      return NextResponse.redirect(new URL(`/${search}`, req.url), 308);
    }
    if (pathname.startsWith("/app/")) {
      const subpath = pathname.slice(4);
      return NextResponse.redirect(new URL(`${subpath}${search}`, req.url), 308);
    }

    // Clean shortcut for /feed
    if (pathname === "/feed" || pathname === "/feed/") {
      return NextResponse.redirect(new URL(`/${search}`, req.url), 308);
    }

    // Check if path is exempt from /app rewriting
    const isExempt = EXEMPT_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix)
    );

    if (!isExempt) {
      const virtualAppPath = `/app${pathname === "/" ? "" : pathname}`;

      // Check public mirrors for unauthenticated crawlers / visitors
      if (!hasSessionCookie(req)) {
        for (const { gated, publicPath } of PUBLIC_MIRRORS) {
          if (virtualAppPath === gated || virtualAppPath.startsWith(gated)) {
            const rest = virtualAppPath.slice(gated.length);
            if (!rest && gated.endsWith("/")) break;
            const url = req.nextUrl.clone();
            url.pathname = `${publicPath}${rest}`;
            url.search = search;
            return NextResponse.redirect(url, 308);
          }
        }
      }

      // Rewrite to /app/* internally while keeping URL bar clean on campsy.app
      const url = req.nextUrl.clone();
      url.pathname = virtualAppPath;
      return NextResponse.rewrite(url);
    }
  }

  // 3. Public mirror handling for direct /app access (e.g. localhost or mirrors)
  if (!hasSessionCookie(req)) {
    for (const { gated, publicPath } of PUBLIC_MIRRORS) {
      if (pathname === gated || pathname.startsWith(gated)) {
        const rest = pathname.slice(gated.length);
        if (!rest && gated.endsWith("/")) break;
        const url = req.nextUrl.clone();
        url.pathname = `${publicPath}${rest}`;
        url.search = search;
        return NextResponse.redirect(url, 308);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with static extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml)$).*)",
  ],
};
