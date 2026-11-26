import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { sendEmail } from "@/lib/email";
import {
  createDbQueueStore,
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_BATCHES,
  isMissingEmailTable,
  processCampaignQueue,
} from "@/lib/email-campaigns/queue";
import { timingSafeCompare } from "@/lib/security/timing";

export const dynamic = "force-dynamic";

function envInt(name: string, fallback: number, max: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
}

/**
 * Drains queued Admin -> Emails campaign recipients in batches (default 4 x 50,
 * 1s pause between batches). Called every 5 minutes by
 * .github/workflows/email-campaigns-cron.yml with `Authorization: Bearer $CRON_SECRET`.
 *
 * Safe to call repeatedly or concurrently: each recipient row is claimed once,
 * so nobody is emailed twice for the same campaign.
 * Pause all campaign sending with EMAIL_CAMPAIGNS_ENABLED=false.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !timingSafeCompare(token, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.EMAIL_CAMPAIGNS_ENABLED === "false") {
    return NextResponse.json({ ok: true, paused: true }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const result = await processCampaignQueue({
      store: createDbQueueStore(getDb()),
      send: sendEmail,
      batchSize: envInt("EMAIL_CAMPAIGN_BATCH_SIZE", DEFAULT_BATCH_SIZE, 100),
      maxBatches: envInt("EMAIL_CAMPAIGN_BATCHES_PER_RUN", DEFAULT_MAX_BATCHES, 10),
      timeBudgetMs: 25_000,
      treatSimulatedAsFailure: process.env.NODE_ENV === "production",
    });
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isMissingEmailTable(error)) {
      return NextResponse.json({ ok: true, skipped: "email tables not migrated" }, { status: 200 });
    }
    console.error("[cron/email-campaigns] failed:", error);
    return NextResponse.json({ error: "Email campaign run failed" }, { status: 500 });
  }
}
