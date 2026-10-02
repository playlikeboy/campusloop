import { and, desc, eq, isNotNull, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { institutions, posts, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scopeParam = searchParams.get("scope") as "CAMPUS" | "GLOBAL" | null;
    let targetInstId = searchParams.get("institutionId");

    const db = getDb();

    // If institutionId not provided and user is authenticated, resolve user's institution
    if (!targetInstId) {
      try {
        const user = await hexclaveServerApp.getUser();
        if (user) {
          const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, user.id),
            columns: { institutionId: true },
          });
          if (profile?.institutionId) {
            targetInstId = profile.institutionId;
          }
        }
      } catch {
        // Public viewer
      }
    }

    // Build conditions for high-priority broadcasts
    const scopeConditions = [];
    if (scopeParam === "CAMPUS" && targetInstId) {
      // Show either broadcast specific to this campus OR pan-India broadcasts
      scopeConditions.push(eq(posts.institutionId, targetInstId));
      scopeConditions.push(eq(posts.scope, "INDIA"));
    } else {
      // Pan-India or global broadcasts
      scopeConditions.push(eq(posts.scope, "INDIA"));
      scopeConditions.push(eq(posts.scope, "GLOBAL"));
    }

    const rawBroadcasts = await db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        scope: posts.scope,
        status: posts.status,
        createdAt: posts.createdAt,
        institutionId: posts.institutionId,
        institutionName: institutions.name,
      })
      .from(posts)
      .leftJoin(institutions, eq(posts.institutionId, institutions.id))
      .where(
        and(
          eq(posts.status, "PUBLISHED"),
          isNotNull(posts.title),
          or(...scopeConditions)
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(10);

    // Filter to broadcasts with announcement prefixes
    const broadcastPosts = rawBroadcasts.filter(
      (p) =>
        p.title &&
        (p.title.includes("[OFFICIAL") ||
          p.title.includes("[URGENT") ||
          p.title.includes("[CAMPUS ALERT]") ||
          p.title.includes("[WARNING]") ||
          p.title.includes("[GENERAL INFO]") ||
          p.title.includes("[INFO]"))
    );

    if (broadcastPosts.length === 0) {
      return NextResponse.json({ success: true, broadcast: null });
    }

    // Pick top broadcast (prefer URGENT / WARNING if present, else newest)
    const urgentBroadcast = broadcastPosts.find(
      (b) => b.title?.includes("[URGENT") || b.title?.includes("[CAMPUS ALERT]")
    );
    const topPost = urgentBroadcast || broadcastPosts[0];

    // Parse priority
    let priority: "INFO" | "ANNOUNCEMENT" | "WARNING" | "URGENT" = "ANNOUNCEMENT";
    if (topPost.title?.includes("[URGENT")) priority = "URGENT";
    else if (topPost.title?.includes("[CAMPUS ALERT]") || topPost.title?.includes("[WARNING]"))
      priority = "WARNING";
    else if (topPost.title?.includes("[GENERAL INFO]") || topPost.title?.includes("[INFO]"))
      priority = "INFO";

    // Clean title
    const cleanTitle = topPost.title
      ? topPost.title.replace(/^\[(OFFICIAL ANNOUNCEMENT|URGENT NOTICE|CAMPUS ALERT|GENERAL INFO|WARNING|INFO)\]\s*/i, "").trim()
      : "Campus Announcement";

    // Extract Banner Image URL if present: ![](url)
    let bannerImageUrl: string | null = null;
    const imgMatch = topPost.body.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/i);
    if (imgMatch) {
      bannerImageUrl = imgMatch[1];
    }

    // Extract CTA button if present: 👉 [Label](url)
    let actionLabel: string | null = null;
    let actionUrl: string | null = null;
    const ctaMatch = topPost.body.match(/👉\s*\[(.*?)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/i);
    if (ctaMatch) {
      actionLabel = ctaMatch[1].trim();
      actionUrl = ctaMatch[2].trim();
    }

    // Clean body text (strip raw title duplicates, image markdown, and cta markdown)
    let cleanBody = topPost.body
      .replace(/^(\*\*\[.*?\]\*\*|\*\*.*?\*\*)\n*/i, "")
      .replace(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/gi, "")
      .replace(/👉\s*\[(.*?)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/gi, "")
      .trim();

    return NextResponse.json({
      success: true,
      broadcast: {
        id: topPost.id,
        rawTitle: topPost.title,
        title: cleanTitle,
        body: cleanBody,
        priority,
        scope: topPost.scope,
        institutionName: topPost.scope === "INDIA" ? "All Indian Campuses" : topPost.institutionName || "Target Campus",
        bannerImageUrl,
        actionLabel,
        actionUrl,
        createdAt: topPost.createdAt ? new Date(topPost.createdAt).toISOString() : null,
      },
    });
  } catch (err: any) {
    console.error("[Broadcasts Active GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
