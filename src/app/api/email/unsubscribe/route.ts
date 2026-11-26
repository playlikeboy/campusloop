import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { allowEmailAction } from "@/lib/email-campaigns/rate-limit";
import { resubscribeProfile, unsubscribeProfile } from "@/lib/email-campaigns/unsubscribe";
import { verifyUnsubscribeToken } from "@/lib/email-campaigns/unsubscribe-token";

export const dynamic = "force-dynamic";

function clientKey(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Marketing-email unsubscribe. No login: the signed token in the link is the proof.
 *
 * - RFC 8058 one-click (mail clients): POST body `List-Unsubscribe=One-Click`, answers 200.
 * - The /unsubscribe page form: POST `action=unsubscribe|resubscribe`, redirects back (303).
 *
 * GET never changes anything, so link scanners that prefetch URLs cannot unsubscribe anyone.
 */
export async function POST(req: NextRequest) {
  if (!(await allowEmailAction(`unsub:${clientKey(req)}`, 30, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "retry-after": "60" } });
  }

  const token = req.nextUrl.searchParams.get("t");
  const profileId = verifyUnsubscribeToken(token);
  if (!profileId) return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });

  let form: FormData | null = null;
  try {
    form = await req.formData();
  } catch {
    form = null;
  }
  const oneClick = form?.get("List-Unsubscribe") === "One-Click";
  const action = form?.get("action") === "resubscribe" ? "resubscribe" : "unsubscribe";

  try {
    const db = getDb();
    const ok =
      action === "resubscribe" && !oneClick
        ? await resubscribeProfile(db, profileId)
        : await unsubscribeProfile(db, profileId, oneClick ? "ONE_CLICK" : "LINK");
    if (oneClick) {
      return NextResponse.json({ ok }, { status: ok ? 200 : 404, headers: { "Cache-Control": "no-store" } });
    }
    const back = new URL("/unsubscribe", req.nextUrl.origin);
    back.searchParams.set("t", token ?? "");
    back.searchParams.set("done", action === "resubscribe" ? "resubscribed" : "unsubscribed");
    return NextResponse.redirect(back, 303);
  } catch (error) {
    console.error("[email/unsubscribe] failed:", error);
    return NextResponse.json({ error: "Could not update your email settings" }, { status: 500 });
  }
}
