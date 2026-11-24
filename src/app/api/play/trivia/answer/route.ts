import { NextResponse } from "next/server";
import { syncAchievementsSafe } from "@/lib/play/server/achievements";
import { badRequest, requirePlayer, serverError } from "@/lib/play/server/context";
import { answerQuestion } from "@/lib/play/server/trivia";

export const dynamic = "force-dynamic";

/** POST /api/play/trivia/answer { runId, index, choice }: choice -1 means time ran out. */
export async function POST(req: Request) {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    const body = (await req.json().catch(() => ({}))) as { runId?: unknown; index?: unknown; choice?: unknown };
    const { runId, index, choice } = body;
    if (
      typeof runId !== "string" ||
      !Number.isInteger(index) ||
      !Number.isInteger(choice) ||
      (choice as number) < -1 ||
      (choice as number) > 3
    ) {
      return badRequest("Pick an answer.");
    }
    const result = await answerQuestion(auth.profile, runId, index as number, choice as number);
    if (!result.ok) return badRequest(result.error, result.status);
    const newBadges = result.done ? await syncAchievementsSafe(auth.profile) : [];
    return NextResponse.json({ ...result, newBadges });
  } catch (e) {
    return serverError("POST trivia/answer", e);
  }
}
