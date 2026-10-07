import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { STREAK_QUALIFYING_EVENTS, type StreakEventType } from "@/constants/streaks";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { recordStreakActivity } from "@/lib/streaks/streak-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
      columns: { id: true, userId: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = ((await req.json().catch(() => ({}))) || {}) as Record<string, any>;
    const eventType = (body?.eventType || "DAILY_MISSION_COMPLETE") as StreakEventType;

    if (!STREAK_QUALIFYING_EVENTS[eventType]) {
      return NextResponse.json(
        { error: "Invalid streak qualifying event type" },
        { status: 400 }
      );
    }

    const result = await recordStreakActivity({
      userId: profile.id,
      eventType,
      sourceEntityId: body?.sourceEntityId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error recording streak activity:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
