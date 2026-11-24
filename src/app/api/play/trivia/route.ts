import { NextResponse } from "next/server";
import { badRequest, requirePlayer, serverError } from "@/lib/play/server/context";
import { getTriviaState, startTrivia } from "@/lib/play/server/trivia";

export const dynamic = "force-dynamic";

/** GET /api/play/trivia: today's quiz state, your quiz streak and today's campus top 10. */
export async function GET() {
  try {
    const auth = await requirePlayer();
    if (!auth.ok) return auth.response;
    return NextResponse.json(await getTriviaState(auth.profile), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return serverError("GET trivia", e);
  }
}

/** POST /api/play/trivia: start (or resume) today's quiz. */
export async function POST() {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    const result = await startTrivia(auth.profile);
    if (!result.ok) return badRequest(result.error, result.status);
    return NextResponse.json({ ok: true, runId: result.runId });
  } catch (e) {
    return serverError("POST trivia", e);
  }
}
