import { type NextRequest, NextResponse } from "next/server";

/**
 * Google sign-in for the CampusLoop Web Android app (apps/capacitor).
 *
 * Google blocks OAuth inside an embedded WebView (403 disallowed_useragent), so the app opens the
 * provider step in a Chrome Custom Tab instead:
 *
 *   1. WebView: Hexclave stores its PKCE verifier cookie and navigates to accounts.google.com.
 *   2. The app intercepts that and opens /app-auth/start?to=<provider url> in a Custom Tab.
 *   3. /app-auth/start sets APP_OAUTH_COOKIE in the browser and forwards to the provider.
 *   4. The provider and Hexclave redirect to /handler/oauth-callback?code&state in the browser.
 *   5. Middleware sees APP_OAUTH_COOKIE on /handler/oauth-callback, clears it and redirects (a plain
 *      30x, so Chrome lets it open an app) to space.campusloop.web://auth/oauth-callback?code&state.
 *      If the app does not open, Chrome falls back to /app-auth/return, which has a button.
 *   6. The app loads /handler/oauth-callback?code&state in its WebView, where the verifier cookie
 *      from step 1 lives, and Hexclave finishes the sign-in there.
 *
 * The code alone is useless without that verifier (PKCE), so passing it through the app link is safe.
 */

export const APP_OAUTH_COOKIE = "cl_app_oauth";
/** Ten minutes is plenty for an account chooser and a 2FA prompt. */
export const APP_OAUTH_COOKIE_MAX_AGE = 600;
export const APP_PACKAGE = "space.campusloop.web";
export const APP_RETURN_SCHEME = "space.campusloop.web";

/** Hexclave handler steps the browser hands back to the app. */
export const APP_RETURN_STEPS = ["oauth-callback", "error"] as const;
export type AppReturnStep = (typeof APP_RETURN_STEPS)[number];

export function isAppReturnStep(value: string | null | undefined): value is AppReturnStep {
  return APP_RETURN_STEPS.includes(value as AppReturnStep);
}

/**
 * Only real OAuth authorize URLs may be forwarded to, so /app-auth/start is not an open redirect.
 * Keep in sync with ShellPlugin.isOAuthProviderUrl in apps/capacitor.
 */
export function isAllowedProviderUrl(raw: string | null | undefined): raw is string {
  if (!raw) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  if (host === "accounts.google.com") return url.pathname.startsWith("/o/oauth2/") || url.pathname.startsWith("/signin/oauth");
  if (host === "github.com") return url.pathname.startsWith("/login/oauth/authorize");
  if (host === "api.hexclave.com" || host === "api.stack-auth.com") return url.pathname.includes("/auth/oauth/authorize/");
  return false;
}

/** Custom-scheme link that reopens the app on the given handler step with the same query. */
export function appReturnUrl(step: AppReturnStep, search: URLSearchParams): string {
  const qs = search.toString();
  return `${APP_RETURN_SCHEME}://auth/${step}${qs ? `?${qs}` : ""}`;
}

/** intent:// form of appReturnUrl: Chrome opens the app, or the fallback page when it can't. */
export function appReturnIntentUrl(step: AppReturnStep, search: URLSearchParams, origin: string): string {
  const qs = search.toString();
  const fallback = new URL("/app-auth/return", origin);
  fallback.searchParams.set("step", step);
  for (const [key, value] of search) fallback.searchParams.append(key, value);
  return (
    `intent://auth/${step}${qs ? `?${qs}` : ""}` +
    `#Intent;scheme=${APP_RETURN_SCHEME};package=${APP_PACKAGE};` +
    `S.browser_fallback_url=${encodeURIComponent(fallback.toString())};end`
  );
}

/**
 * Middleware step 5: in the browser that runs an app sign-in, send the Hexclave callback (or its
 * error page) back to the app. Returns null for every other request.
 */
export function appOAuthReturnRedirect(req: NextRequest): NextResponse | null {
  const { pathname, searchParams, origin } = req.nextUrl;
  if (!pathname.startsWith("/handler/") || !req.cookies.has(APP_OAUTH_COOKIE)) return null;
  const step = pathname.slice("/handler/".length).replace(/\/+$/, "");
  if (!isAppReturnStep(step)) return null;
  // Hexclave error pages may arrive without query params; the callback always carries some.
  if (step === "oauth-callback" && !searchParams.has("code") && !searchParams.has("errorCode")) return null;

  const res = new NextResponse(null, {
    status: 302,
    headers: {
      Location: appReturnIntentUrl(step, searchParams, origin),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
  res.cookies.set(APP_OAUTH_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, secure: true, sameSite: "lax" });
  return res;
}
