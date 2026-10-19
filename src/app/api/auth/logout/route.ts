import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { sanitizeReturnTo } from "@/lib/auth-redirect";

export const dynamic = "force-dynamic";

const AUTH_COOKIE_PATTERNS = [
  "stack",
  "hexclave",
  "session",
  "token",
  "auth",
  "cl_",
  "__host-",
  "refresh",
  "jwt",
];

const KNOWN_COOKIE_NAMES = [
  "hexclave-token",
  "hexclave-refresh-token",
  "hexclave-session",
  "hexclave-user",
  "hexclave-is-https",
  "stack-token",
  "stack-refresh-token",
  "stack-session",
  "stack-user",
  "stack-is-https",
  "cl_token",
  "cl_session",
  "cl_user",
  "cl_session_token",
  "cl_auth_token",
];

function isAuthCookie(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    KNOWN_COOKIE_NAMES.includes(lower) ||
    AUTH_COOKIE_PATTERNS.some((pattern) => lower.includes(pattern))
  );
}

function clearAllAuthCookies(res: NextResponse, reqCookies: { name: string; value: string }[]) {
  const namesToDelete = new Set<string>();

  for (const c of reqCookies) {
    if (isAuthCookie(c.name)) {
      namesToDelete.add(c.name);
    }
  }

  for (const name of KNOWN_COOKIE_NAMES) {
    namesToDelete.add(name);
  }

  for (const name of namesToDelete) {
    res.cookies.delete(name);
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.headers.set("Pragma", "no-cache");
}

export async function POST(req: NextRequest) {
  try {
    const isJson =
      req.headers.get("accept")?.includes("application/json") ||
      req.headers.get("content-type")?.includes("application/json") ||
      !req.headers.get("accept")?.includes("text/html");

    let res: NextResponse;
    if (isJson) {
      res = NextResponse.json({ success: true, message: "Logged out" });
    } else {
      const rawReturnTo = req.nextUrl.searchParams.get("returnTo");
      const cleanReturnTo = sanitizeReturnTo(rawReturnTo);
      const dest = cleanReturnTo || "/sign-in?logged_out=1";
      res = NextResponse.redirect(new URL(dest.startsWith("/") ? dest : `/${dest}`, req.url), 303);
    }

    try {
      const cookieStore = await cookies();
      for (const c of cookieStore.getAll()) {
        if (isAuthCookie(c.name)) {
          cookieStore.delete(c.name);
        }
      }
    } catch {}

    clearAllAuthCookies(res, req.cookies.getAll());

    return res;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json({ success: true, message: "Logged out with fallback" });
  }
}

export async function GET(req: NextRequest) {
  try {
    const isJson = req.headers.get("accept")?.includes("application/json");

    let res: NextResponse;
    if (isJson) {
      res = NextResponse.json({ success: true, message: "Logged out" });
    } else {
      const rawReturnTo = req.nextUrl.searchParams.get("returnTo");
      const cleanReturnTo = sanitizeReturnTo(rawReturnTo);
      const dest = cleanReturnTo || "/sign-in?logged_out=1";
      res = NextResponse.redirect(new URL(dest.startsWith("/") ? dest : `/${dest}`, req.url), 303);
    }

    try {
      const cookieStore = await cookies();
      for (const c of cookieStore.getAll()) {
        if (isAuthCookie(c.name)) {
          cookieStore.delete(c.name);
        }
      }
    } catch {}

    clearAllAuthCookies(res, req.cookies.getAll());

    return res;
  } catch (error) {
    console.error("Logout API GET error:", error);
    return NextResponse.redirect(new URL("/sign-in?logged_out=1", req.url), 303);
  }
}
