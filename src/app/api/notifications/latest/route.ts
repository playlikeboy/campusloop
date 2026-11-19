import { NextResponse } from "next/server";
import { buildLatestPushPayload } from "@/lib/push-dispatch";
import { getCachedAuthUser, getCachedBareProfile } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

/**
 * The newest unread notification, for the service worker when a push arrives
 * without a payload (a tickle). Encrypted pushes carry the same payload and
 * never need this round trip. Shape is shared with push-dispatch, so both
 * paths render identically, and CRUSH_ALERT stays anonymous on both.
 */
export async function GET() {
  try {
    const user = await getCachedAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getCachedBareProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const notification = await buildLatestPushPayload(profile.id);
    return NextResponse.json(
      { notification, unreadCount: notification?.unreadCount ?? 0 },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/notifications/latest error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
