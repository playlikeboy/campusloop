import { NextResponse } from "next/server";
import { requireAdminApi } from "@/app/admin/_lib/guard";
import { getAllRedditSources, ingestRedditContent, redditClient } from "@/lib/reddit";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reddit/ingest
 * Returns Reddit API configuration status and the configured subreddits.
 */
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;

    const sources = getAllRedditSources();
    const isConfigured = redditClient.isConfigured();

    return NextResponse.json({
      configured: isConfigured,
      sources,
      totalSources: sources.length,
      activeSources: sources.filter((s) => s.enabled).length,
    });
  } catch (err) {
    console.error("Admin Reddit status check failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/reddit/ingest
 * Triggers an ingestion run for configured subreddits or a specific subreddit.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) return auth.errorResponse;

    const body = await req.json().catch(() => ({}));
    const { subreddit, limit, sort, dryRun } = body as {
      subreddit?: string;
      limit?: number;
      sort?: "hot" | "new" | "top_day" | "top_week";
      dryRun?: boolean;
    };

    const summary = await ingestRedditContent({
      subreddit,
      limit: typeof limit === "number" ? limit : 25,
      sort: sort || "hot",
      dryRun: Boolean(dryRun),
    });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err) {
    console.error("Admin Reddit ingestion failed:", err);
    return NextResponse.json(
      {
        error: "Ingestion failed or unauthorized",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
