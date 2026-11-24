import { NextResponse } from "next/server";
import { badRequest, getBlockedIds, requirePlayer, serverError } from "@/lib/play/server/context";
import { pickDpPair, voteDp } from "@/lib/play/server/dp";

export const dynamic = "force-dynamic";

/**
 * POST /api/play/dp/vote { winnerId, loserId }: "Better DP?" pick.
 * Returns the next pair. Who voted for what is never returned anywhere.
 */
export async function POST(req: Request) {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    const body = (await req.json().catch(() => ({}))) as { winnerId?: unknown; loserId?: unknown };
    if (typeof body.winnerId !== "string" || typeof body.loserId !== "string") {
      return badRequest("Pick one of the two DPs.");
    }
    const blocked = await getBlockedIds(auth.profile.id);
    const result = await voteDp(auth.profile, blocked, body.winnerId, body.loserId);
    const next = await pickDpPair(auth.profile, blocked);
    if (!result.ok) return NextResponse.json({ error: result.error, ...next }, { status: result.status });
    return NextResponse.json({ ok: true, ...next });
  } catch (e) {
    return serverError("POST dp/vote", e);
  }
}
