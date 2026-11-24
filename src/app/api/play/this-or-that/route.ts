import { NextResponse } from "next/server";
import { syncAchievementsSafe } from "@/lib/play/server/achievements";
import { badRequest, requirePlayer, serverError } from "@/lib/play/server/context";
import { getThisOrThat, totPicksFor, voteThisOrThat } from "@/lib/play/server/this-or-that";

export const dynamic = "force-dynamic";

const BADGE_PICKS = new Set([25, 100]);

/** GET /api/play/this-or-that: up to 10 polls you haven't answered, plus your recent results. */
export async function GET() {
  try {
    const auth = await requirePlayer();
    if (!auth.ok) return auth.response;
    return NextResponse.json(await getThisOrThat(auth.profile), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return serverError("GET this-or-that", e);
  }
}

/** POST /api/play/this-or-that { promptId, choice: "A" | "B" }: results come back only after you pick. */
export async function POST(req: Request) {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    const body = (await req.json().catch(() => ({}))) as { promptId?: unknown; choice?: unknown };
    if (typeof body.promptId !== "string" || (body.choice !== "A" && body.choice !== "B")) {
      return badRequest("Pick one side.");
    }
    const result = await voteThisOrThat(auth.profile, body.promptId, body.choice);
    if (!result.ok) return badRequest(result.error, result.status);
    const picks = await totPicksFor(auth.profile.id);
    const newBadges = BADGE_PICKS.has(picks) ? await syncAchievementsSafe(auth.profile) : [];
    return NextResponse.json({ ok: true, result: result.result, picks, newBadges });
  } catch (e) {
    return serverError("POST this-or-that", e);
  }
}
