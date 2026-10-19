import { NextResponse } from "next/server";
import { clearMerchantSessionCookie } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out from merchant portal" });
  clearMerchantSessionCookie(res);
  return res;
}

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/merchant-portal/login", req.url), 303);
  clearMerchantSessionCookie(res);
  return res;
}
