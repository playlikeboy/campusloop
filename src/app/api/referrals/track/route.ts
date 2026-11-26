import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { linkClicks, shortLinks } from "@/db/schema";
import { isUtmRefCode } from "@/lib/referrals/utm";

export const dynamic = "force-dynamic";

function parseUserAgent(userAgent?: string | null) {
  if (!userAgent) {
    return { device: "desktop", browser: "unknown", os: "unknown" };
  }

  const ua = userAgent.toLowerCase();

  // Device
  let device = "desktop";
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    device = "mobile";
  } else if (/ipad|tablet/i.test(ua)) {
    device = "tablet";
  }

  // Browser
  let browser = "other";
  if (ua.includes("chrome") && !ua.includes("edg") && !ua.includes("opr")) {
    browser = "Chrome";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("edg")) {
    browser = "Edge";
  } else if (ua.includes("opr") || ua.includes("opera")) {
    browser = "Opera";
  }

  // OS
  let os = "other";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) os = "iOS";
  else if (ua.includes("linux")) os = "Linux";

  return { device, browser, os };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const ref = String(body.ref || "")
      .trim()
      .slice(0, 128);
    const referer = body.referer || req.headers.get("referer") || null;

    if (!ref) {
      return NextResponse.json({ success: false, message: "Missing ref" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent");
    // cf-connecting-ip is set by Cloudflare and can't be spoofed; x-forwarded-for is client-controlled.
    const ip =
      req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const country = req.headers.get("cf-ipcountry") || null;

    const { device, browser, os } = parseUserAgent(userAgent);
    const db = getDb();

    const isCampaign = isUtmRefCode(ref);

    // Check if ref corresponds to a short link
    const matchedLink = isCampaign
      ? null
      : await db.query.shortLinks.findFirst({
          where: eq(shortLinks.slug, ref.toLowerCase()),
        });

    // Record click
    await db.insert(linkClicks).values({
      shortLinkId: matchedLink?.id || null,
      refCode: ref,
      ip: ip ? ip.slice(0, 64) : null,
      userAgent: userAgent ? userAgent.slice(0, 500) : null,
      device,
      browser,
      os,
      referer: referer ? referer.slice(0, 500) : null,
      country,
    });

    if (matchedLink) {
      await db
        .update(shortLinks)
        .set({
          clicks: sql`${shortLinks.clicks} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(shortLinks.id, matchedLink.id));
    }

    const response = NextResponse.json({ success: true, ref });

    // A campaign click is only logged. The invite cookie is for people and short links.
    if (isCampaign) return response;

    // Set 30-day attribution cookie
    response.cookies.set("campusloop_ref", ref, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err) {
    console.error("Referral tracking error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
