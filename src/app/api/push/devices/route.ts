import { NextResponse } from "next/server";
import { deleteDeviceToken, isExpoPushToken, upsertDeviceToken } from "@/lib/expo-push";
import { requireProfile } from "@/lib/require-profile";

export const dynamic = "force-dynamic";

/**
 * Expo push tokens for the Android app (see docs/mobile-api.md).
 * POST registers or moves a token to the caller; DELETE removes it on sign-out.
 * Until drizzle/manual/0012 is applied both answer 503 instead of crashing.
 */

type Body = { token?: unknown; platform?: unknown };

export async function POST(req: Request) {
  const auth = await requireProfile();
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!isExpoPushToken(body.token)) return NextResponse.json({ error: "Invalid Expo push token" }, { status: 400 });
  const platform = body.platform === "ios" ? "ios" : "android";
  const ok = await upsertDeviceToken(auth.profile.id, body.token, platform);
  if (!ok) return NextResponse.json({ error: "Push is not available yet" }, { status: 503 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireProfile();
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!isExpoPushToken(body.token)) return NextResponse.json({ error: "Invalid Expo push token" }, { status: 400 });
  const ok = await deleteDeviceToken(auth.profile.id, body.token);
  if (!ok) return NextResponse.json({ error: "Push is not available yet" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
