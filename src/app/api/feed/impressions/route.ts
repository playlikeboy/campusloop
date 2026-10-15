import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { posts, userBehaviorEvents } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { getRankingVariant, RANKING_EXPERIMENT } from "@/lib/recommendations/experiments";

export const dynamic = "force-dynamic";

const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const MAX_ITEMS = 30;
const MAX_DWELL_MS = 120_000;

/**
 * Batched feed impressions from useFeedImpressions (sendBeacon or fetch).
 * Each item becomes a POST_DWELL event carrying the post's type and author,
 * which viewer-affinity reads back to learn skip patterns, and the viewer's
 * experiment arm, which the admin experiment readout groups by.
 */
export async function POST(req: Request) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as {
      items?: { postId?: unknown; dwellMs?: unknown }[];
      sort?: unknown;
    } | null;

    const dwellById = new Map<string, number>();
    for (const item of (Array.isArray(body?.items) ? body.items : []).slice(0, MAX_ITEMS)) {
      if (typeof item?.postId !== "string" || !SAFE_ID.test(item.postId)) continue;
      const dwellMs = Math.round(Number(item.dwellMs));
      if (!Number.isFinite(dwellMs) || dwellMs <= 0) continue;
      dwellById.set(item.postId, Math.min(MAX_DWELL_MS, dwellMs));
    }
    if (dwellById.size === 0) return NextResponse.json({ ok: true, recorded: 0 });

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: (up, { eq }) => eq(up.userId, user.id),
      columns: { id: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const postRows = await db
      .select({ id: posts.id, type: posts.type, authorId: posts.authorId, isAnonymous: posts.isAnonymous })
      .from(posts)
      .where(inArray(posts.id, [...dwellById.keys()]));

    const sort = typeof body?.sort === "string" && /^[a-z_]{1,20}$/.test(body.sort) ? body.sort : null;
    const variant = getRankingVariant(profile.id);

    const rows = postRows
      .filter((p) => p.authorId !== profile.id)
      .map((p) => {
        const dwellMs = dwellById.get(p.id) ?? 0;
        return {
          userId: profile.id,
          eventType: "POST_DWELL",
          targetType: "POST",
          targetId: p.id,
          metadata: {
            dwellMs,
            postType: p.type,
            // Anonymous authors are never recorded, so skip learning can't de-anonymise.
            authorId: p.isAnonymous ? null : p.authorId,
            sort,
            experiment: RANKING_EXPERIMENT.id,
            variant,
          },
          weight: dwellMs >= 8000 ? 5 : dwellMs >= 2500 ? 2 : 1,
        };
      });

    if (rows.length > 0) await db.insert(userBehaviorEvents).values(rows);
    return NextResponse.json({ ok: true, recorded: rows.length });
  } catch (error) {
    console.error("POST /api/feed/impressions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
