import { and, desc, eq, ilike, isNotNull, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/app/admin/_lib/guard";
import { getDb } from "@/db";
import { institutions, notifications, posts, userProfiles } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const scope = searchParams.get("scope");
    const status = searchParams.get("status") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const offset = (page - 1) * limit;

    const db = getDb();

    // Query broadcast posts (identified by having a title starting with [OFFICIAL or [URGENT or [CAMPUS or isNotNull)
    const conditions = [isNotNull(posts.title)];

    if (q.trim()) {
      const pattern = `%${q.trim()}%`;
      conditions.push(or(ilike(posts.title, pattern), ilike(posts.body, pattern))!);
    }

    if (scope && scope !== "ALL") {
      conditions.push(eq(posts.scope, scope as any));
    }

    if (status !== "ALL") {
      conditions.push(eq(posts.status, status as any));
    }

    const rawPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        scope: posts.scope,
        status: posts.status,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorId: posts.authorId,
        institutionId: posts.institutionId,
        institutionName: institutions.name,
        institutionDistrict: institutions.district,
        institutionState: institutions.state,
      })
      .from(posts)
      .leftJoin(institutions, eq(posts.institutionId, institutions.id))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const formatted = rawPosts.map((p) => {
      // Parse priority from title prefix
      let priority: "INFO" | "ANNOUNCEMENT" | "WARNING" | "URGENT" = "ANNOUNCEMENT";
      if (p.title?.includes("[URGENT")) priority = "URGENT";
      else if (p.title?.includes("[CAMPUS ALERT]") || p.title?.includes("[WARNING]")) priority = "WARNING";
      else if (p.title?.includes("[GENERAL INFO]") || p.title?.includes("[INFO]")) priority = "INFO";

      return {
        id: p.id,
        title: p.title,
        body: p.body,
        scope: p.scope,
        status: p.status,
        priority,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
        institutionId: p.institutionId,
        institutionName: p.institutionName,
        institutionLocation: [p.institutionDistrict, p.institutionState].filter(Boolean).join(", "),
      };
    });

    return NextResponse.json({
      success: true,
      broadcasts: formatted,
      page,
      limit,
    });
  } catch (err: any) {
    console.error("[Admin Broadcasts GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;
    const profile = auth.profile;
    const body = (await req.json()) as any;
    const {
      title,
      message,
      scope,
      institutionId,
      priority,
      sendNotification,
      actionLabel,
      actionUrl,
      bannerImageUrl,
      deliveryChannels = ["FEED_HERO"],
    } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const db = getDb();

    // Determine target institution
    let targetInstId = institutionId;
    if (!targetInstId) {
      const fallback = await db.query.institutions.findFirst();
      targetInstId = fallback?.id;
    }

    const postScope = scope === "CAMPUS" ? "CAMPUS" : "INDIA";
    const announcementPrefix =
      priority === "URGENT"
        ? "[URGENT NOTICE]"
        : priority === "WARNING"
          ? "[CAMPUS ALERT]"
          : priority === "INFO"
            ? "[GENERAL INFO]"
            : "[OFFICIAL ANNOUNCEMENT]";

    let postBody = `**${announcementPrefix} ${title.trim()}**\n\n${message.trim()}`;

    // Append Banner Image if supplied
    if (bannerImageUrl?.trim()) {
      postBody = `![](${bannerImageUrl.trim()})\n\n${postBody}`;
    }

    // Append Action CTA link if supplied
    if (actionLabel?.trim() && actionUrl?.trim()) {
      postBody += `\n\n👉 [${actionLabel.trim()}](${actionUrl.trim()})`;
    }

    // 1. Create official broadcast post
    const [broadcastPost] = await db
      .insert(posts)
      .values({
        authorId: profile.id,
        institutionId: targetInstId,
        title: `${announcementPrefix} ${title.trim()}`,
        body: postBody,
        type: "NORMAL",
        scope: postScope,
        isAnonymous: false,
        status: "PUBLISHED",
      })
      .returning();

    let notificationCount = 0;

    // 2. If sendNotification is true, broadcast notifications to target users
    if (sendNotification) {
      const targetUsers = await db.query.userProfiles.findMany({
        where:
          postScope === "CAMPUS" && targetInstId ? eq(userProfiles.institutionId, targetInstId) : undefined,
        columns: { id: true },
        limit: 300,
      });

      if (targetUsers.length > 0) {
        const notifValues = targetUsers.map((u) => ({
          userId: u.id,
          type: "MILESTONE" as const,
          actorId: profile.id,
          referenceId: broadcastPost.id,
          previewText: `${announcementPrefix}: ${title.slice(0, 60)}`,
        }));

        await db.insert(notifications).values(notifValues);
        notificationCount = notifValues.length;
      }
    }

    return NextResponse.json({
      success: true,
      broadcastPost,
      notificationCount,
      message: `Broadcast published successfully! ${notificationCount > 0 ? `Sent to ${notificationCount} students.` : ""}`,
    });
  } catch (err: any) {
    console.error("[Admin Broadcasts POST Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;

    const body = (await req.json()) as { id?: string; status?: "PUBLISHED" | "ARCHIVED" | "HIDDEN" };
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Broadcast ID and target status are required" }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(posts)
      .set({ status, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      broadcast: updated,
      message: status === "ARCHIVED" ? "Broadcast retracted and archived." : "Broadcast status updated.",
    });
  } catch (err: any) {
    console.error("[Admin Broadcasts PATCH Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Broadcast ID is required" }, { status: 400 });
    }

    const db = getDb();
    const [deleted] = await db
      .update(posts)
      .set({ status: "DELETED", updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Broadcast deleted permanently.",
    });
  } catch (err: any) {
    console.error("[Admin Broadcasts DELETE Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
