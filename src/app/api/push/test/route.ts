import { NextResponse } from "next/server";
import { pushExpoTestToProfile } from "@/lib/expo-push";
import { pushTestToUser } from "@/lib/push-dispatch";
import { requireProfile } from "@/lib/require-profile";
import { getVapidKeys } from "@/lib/web-push";

export const dynamic = "force-dynamic";

/**
 * POST /api/push/test — send a test notification to every browser and app
 * install of the signed-in student, and report what each push service said.
 *
 * Bypasses preferences and mutes on purpose: the student asked for it.
 * Writes no notification row.
 */
export async function POST() {
  try {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;

    const [web, expo] = await Promise.all([pushTestToUser(auth.profile.id), pushExpoTestToProfile(auth.profile.id)]);
    const results = [...web, ...expo];
    const sent = results.filter((r) => r.result === "sent").length;

    return NextResponse.json({
      ok: sent > 0,
      sent,
      total: results.length,
      webPushConfigured: getVapidKeys() !== null,
      results,
    });
  } catch (error) {
    console.error("POST /api/push/test error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
