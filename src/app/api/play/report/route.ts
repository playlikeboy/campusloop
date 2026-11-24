import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { PLAY_REPORT_REASONS, PLAY_THRESHOLDS } from "@/constants/play";
import { getDb } from "@/db";
import { playDpEntries, playMemes, playReports } from "@/db/schema";
import { badRequest, requirePlayer, serverError } from "@/lib/play/server/context";

export const dynamic = "force-dynamic";

const REASONS = new Set<string>(PLAY_REPORT_REASONS.map((r) => r.value));

/**
 * POST /api/play/report { targetType: "DP_ENTRY" | "MEME", targetId, reason }
 * One report per student per item. At 3 reports the item is hidden for everyone.
 */
export async function POST(req: Request) {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    const { profile } = auth;
    const body = (await req.json().catch(() => ({}))) as { targetType?: unknown; targetId?: unknown; reason?: unknown };
    const { targetType, targetId, reason } = body;
    if ((targetType !== "DP_ENTRY" && targetType !== "MEME") || typeof targetId !== "string") {
      return badRequest("Nothing to report.");
    }
    if (typeof reason !== "string" || !REASONS.has(reason)) return badRequest("Pick a reason.");

    const db = getDb();
    const table = targetType === "DP_ENTRY" ? playDpEntries : playMemes;
    const [target] = await db
      .select({ institutionId: table.institutionId, profileId: table.profileId })
      .from(table)
      .where(eq(table.id, targetId))
      .limit(1);
    if (!target || target.institutionId !== profile.institutionId) return badRequest("Nothing to report.", 404);
    if (target.profileId === profile.id) return badRequest("You can't report your own entry.");

    const inserted = await db
      .insert(playReports)
      .values({ targetType, targetId, reporterId: profile.id, reason })
      .onConflictDoNothing()
      .returning({ id: playReports.id });

    if (inserted.length > 0) {
      await db
        .update(table)
        .set({
          reportCount: sql`${table.reportCount} + 1`,
          status: sql`CASE WHEN ${table.reportCount} + 1 >= ${PLAY_THRESHOLDS.AUTO_HIDE_REPORTS} AND ${table.status} = 'ACTIVE' THEN 'HIDDEN' ELSE ${table.status} END`,
        })
        .where(and(eq(table.id, targetId)));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("POST report", e);
  }
}
