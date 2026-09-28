import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { posts, reports, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // Verify post exists
    const targetPost = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      columns: { id: true, status: true },
    });

    if (!targetPost || targetPost.status === "DELETED") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { reason, details } = (await req.json()) as { reason: string; details?: string };

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    // Prevent duplicate report spamming by the same user
    const existingReport = await db.query.reports.findFirst({
      where: and(
        eq(reports.reporterId, profile.id),
        eq(reports.targetId, id),
        eq(reports.targetType, "POST")
      ),
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already submitted a report for this post" },
        { status: 409 }
      );
    }

    // Insert the report
    await db.insert(reports).values({
      reporterId: profile.id,
      targetType: "POST",
      targetId: id,
      reason: reason.trim().slice(0, 500),
      details: details ? details.trim().slice(0, 2000) : null,
      status: "OPEN",
    });

    // Check count of distinct unique reporters for this post
    const reportsCountResult = await db
      .select({ count: sql<number>`count(DISTINCT ${reports.reporterId})::int` })
      .from(reports)
      .where(and(eq(reports.targetId, id), eq(reports.targetType, "POST")));

    const uniqueReporters = reportsCountResult[0]?.count || 0;

    // Auto-hide rule: Hide post only if at least 5 distinct unique users report it
    if (uniqueReporters >= 5 && targetPost.status === "PUBLISHED") {
      await db.update(posts).set({ status: "PENDING_REVIEW" }).where(eq(posts.id, id));
    }

    return NextResponse.json({ message: "Post reported successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
