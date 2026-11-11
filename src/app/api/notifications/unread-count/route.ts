import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { getCachedAuthUser, getCachedBareProfile } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Auth user and profile come from the isolate cache (30s), so a warm
    // isolate answers this poll with a single count query.
    const user = await getCachedAuthUser();
    if (!user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const profile = await getCachedBareProfile(user.id);
    if (!profile) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const db = getDb();
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, profile.id), eq(notifications.isRead, false)));

    return NextResponse.json({ unreadCount: row?.count || 0 });
  } catch (error) {
    console.error("GET /api/notifications/unread-count error:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
