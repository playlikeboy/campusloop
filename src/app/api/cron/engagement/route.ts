import { type NextRequest, NextResponse } from "next/server";
import { runEngagement } from "@/lib/engagement/run";
import { timingSafeCompare } from "@/lib/security/timing";

export const dynamic = "force-dynamic";

/**
 * Re-engagement pushes, called every 30 minutes by
 * .github/workflows/engagement-cron.yml with `Authorization: Bearer $CRON_SECRET`.
 *
 * `?dryRun=1` returns who would get what without writing or sending anything.
 * Safe to call repeatedly: engagement_sends allows one push per student, kind and IST day.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !timingSafeCompare(token, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRunParam = req.nextUrl.searchParams.get("dryRun");
  const dryRun = dryRunParam === "1" || dryRunParam === "true";

  // Lets a dry run be checked against a chosen moment, e.g. ?dryRun=1&at=2026-11-19T15:00:00Z.
  const at = dryRun ? req.nextUrl.searchParams.get("at") : null;
  const now = at && !Number.isNaN(Date.parse(at)) ? new Date(at) : new Date();

  try {
    const result = await runEngagement({ now, dryRun });
    return NextResponse.json(
      {
        ...result,
        // A dry run lists the plan; a real run only reports totals.
        planned: dryRun ? result.planned : undefined,
        plannedCount: result.planned.length,
      },
      { status: result.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[cron/engagement] failed:", error);
    return NextResponse.json({ error: "Engagement run failed" }, { status: 500 });
  }
}
