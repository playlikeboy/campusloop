/**
 * Sanitizes returnTo / after_auth_return_to parameters to prevent:
 * 1. Infinite redirect loops back to auth pages (/handler, /sign-in, /sign-up, etc.)
 * 2. Open redirect vulnerabilities to external origins
 * 3. Double-encoded redirect payloads
 */
export function sanitizeReturnTo(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  let decoded = url.trim();
  if (!decoded) return null;

  // Unroll up to 3 layers of URI encoding
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next.trim();
    } catch {
      break;
    }
  }

  // Parse path
  let pathname = "";
  let search = "";
  let hash = "";

  if (decoded.startsWith("/") && !decoded.startsWith("//")) {
    try {
      const parsed = new URL(decoded, "https://campusloop.space");
      pathname = parsed.pathname;
      search = parsed.search;
      hash = parsed.hash;
    } catch {
      return null;
    }
  } else {
    // If absolute URL, ensure it's campusloop or localhost
    try {
      const parsed = new URL(decoded);
      const isAllowedHost =
        parsed.hostname === "campusloop.space" ||
        parsed.hostname.endsWith(".campusloop.space") ||
        parsed.hostname === "campsy.app" ||
        parsed.hostname.endsWith(".campsy.app") ||
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1";

      if (!isAllowedHost) {
        return null;
      }
      pathname = parsed.pathname;
      search = parsed.search;
      hash = parsed.hash;
    } catch {
      return null;
    }
  }

  // Normalize pathname
  pathname = pathname.replace(/\/+/g, "/");

  // Strip trailing slash if longer than 1 char
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const lowerPath = pathname.toLowerCase();

  // Loopback / Auth route blacklist
  const loopbackPrefixes = [
    "/handler",
    "/sign-in",
    "/sign-up",
    "/sign-out",
    "/login",
    "/register",
    "/logout",
    "/api/auth",
    "/invalid-email",
  ];

  for (const prefix of loopbackPrefixes) {
    if (lowerPath === prefix || lowerPath.startsWith(prefix + "/")) {
      return null;
    }
  }

  // Redirect root or /app directly to /feeds
  if (lowerPath === "/app" || lowerPath === "") {
    pathname = "/feeds";
  }

  // Strip any nested poisoned search params inside search
  if (search) {
    try {
      const sp = new URLSearchParams(search);
      const badKeys = ["after_auth_return_to", "returnTo", "redirect"];
      let modified = false;
      for (const key of badKeys) {
        if (sp.has(key)) {
          const val = (sp.get(key) || "").toLowerCase();
          if (loopbackPrefixes.some((p) => val.includes(p))) {
            sp.delete(key);
            modified = true;
          }
        }
      }
      search = modified ? (sp.toString() ? `?${sp.toString()}` : "") : search;
    } catch {}
  }

  return `${pathname}${search}${hash}`;
}
