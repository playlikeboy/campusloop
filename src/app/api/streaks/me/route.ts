import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { getUserStreakState } from "@/lib/streaks/streak-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedProfileId = searchParams.get("profileId");

    const db = getDb();
    let targetProfileId: string;

    if (requestedProfileId) {
      targetProfileId = requestedProfileId;
    } else {
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
        columns: { id: true, userId: true },
      });

      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      targetProfileId = profile.id;
    }

    const streakState = await getUserStreakState(targetProfileId);
    return NextResponse.json(streakState);
  } catch (error) {
    console.error("Error fetching user streak state:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
