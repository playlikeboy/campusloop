import { NextResponse } from "next/server";
import { badRequest, requirePlayer, serverError } from "@/lib/play/server/context";
import { serveQuestion } from "@/lib/play/server/trivia";

export const dynamic = "force-dynamic";

/** POST /api/play/trivia/question { runId }: show the current question and start its timer. */
export async function POST(req: Request) {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    const body = (await req.json().catch(() => ({}))) as { runId?: unknown };
    if (typeof body.runId !== "string") return badRequest("Start the quiz first.");
    const result = await serveQuestion(auth.profile, body.runId);
    if (!result.ok) return badRequest(result.error, result.status);
    return NextResponse.json(result.question, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return serverError("POST trivia/question", e);
  }
}
