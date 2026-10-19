import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { HEARTBEAT_INTERVAL_MS } from "@/lib/presence";
import { readRequestGeo, recordIpLocation } from "@/lib/geo/location";
import { recordHeartbeat } from "@/lib/presence-server";

export const dynamic = "force-dynamic";

/** Heartbeat: marks the signed-in student as present right now. */
export async function POST(req: Request) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      columns: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await recordHeartbeat(profile.id);
    // City-level IP geo, throttled to one write per 6h; never blocks presence.
    await recordIpLocation(profile.id, readRequestGeo(req)).catch(() => {});

    return NextResponse.json({ ok: true, nextHeartbeatMs: HEARTBEAT_INTERVAL_MS });
  } catch (error) {
    console.error("POST /api/presence error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
