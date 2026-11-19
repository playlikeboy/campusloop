/**
 * Client-only hint that a session exists: Hexclave keeps the refresh token in a
 * readable cookie (`hexclave-refresh-<project>`, `__Host-` and legacy `stack-` variants).
 * Lets signed-out pages skip calls that would only return 401. Never a security check.
 */
const REFRESH_COOKIE = /(?:^|;\s*)(?:__Host-)?(?:hexclave|stack)-refresh/;

export function hasAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return REFRESH_COOKIE.test(document.cookie);
  } catch {
    return false;
  }
}
