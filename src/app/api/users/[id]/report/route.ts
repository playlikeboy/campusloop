import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { requireProfile } from "@/lib/require-profile";
import { findTargetProfile } from "../../_target";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Report a student (`:id` is a profile id or username). Body: { reason, details? }. */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;
    const target = await findTargetProfile((await params).id);
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.id === profile.id) return NextResponse.json({ error: "You can't report yourself" }, { status: 400 });

    const { reason, details } = (await req.json().catch(() => ({}))) as { reason?: unknown; details?: unknown };
    if (typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = await db.query.reports.findFirst({
      where: and(eq(reports.reporterId, profile.id), eq(reports.targetId, target.id), eq(reports.targetType, "USER")),
      columns: { id: true },
    });
    if (existing) return NextResponse.json({ error: "You have already reported this person" }, { status: 409 });

    await db.insert(reports).values({
      reporterId: profile.id,
      targetType: "USER",
      targetId: target.id,
      reason: reason.trim().slice(0, 500),
      details: typeof details === "string" && details.trim() ? details.trim().slice(0, 2000) : null,
      status: "OPEN",
    });
    return NextResponse.json({ message: "User reported" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users/[id]/report error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
