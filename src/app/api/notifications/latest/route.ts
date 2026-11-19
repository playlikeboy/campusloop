import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { notifications, userProfiles } from "@/db/schema";
import { buildTitle, defaultBody, buildUrl } from "@/lib/notification-copy";
import { getCachedAuthUser } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

/**
 * The newest unread notification, rendered by the service worker after a push
 * tickle wakes it. Content is fetched over the student's own session, so it
 * never travels through the push service.
 */
export async function GET() {
  try {
    const user = await getCachedAuthUser();
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

    const [latest] = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, profile.id), eq(notifications.isRead, false)),
      orderBy: [desc(notifications.createdAt)],
      limit: 1,
      with: {
        actor: {
          columns: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    const [unreadRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, profile.id), eq(notifications.isRead, false)));

    if (!latest) {
      return NextResponse.json({ notification: null, unreadCount: 0 });
    }

    // CRUSH_ALERT is intentionally anonymous — never name the sender.
    const anonymous = latest.type === "CRUSH_ALERT";
    const actorName = anonymous ? "Someone" : latest.actor?.displayName || "A student";

    return NextResponse.json({
      unreadCount: unreadRow?.count || 0,
      notification: {
        id: latest.id,
        type: latest.type,
        title: buildTitle(latest.type, actorName),
        body: latest.previewText || defaultBody(latest.type, actorName),
        icon: anonymous ? null : latest.actor?.avatarUrl || null,
        url: buildUrl(latest.type, latest.referenceId),
      },
    });
  } catch (error) {
    console.error("GET /api/notifications/latest error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
