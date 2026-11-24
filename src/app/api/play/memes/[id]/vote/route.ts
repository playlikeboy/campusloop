import { NextResponse } from "next/server";
import { badRequest, getBlockedIds, requirePlayer, serverError } from "@/lib/play/server/context";
import { toggleMemeVote } from "@/lib/play/server/memes";

export const dynamic = "force-dynamic";

/** POST /api/play/memes/:id/vote: upvote, or take your upvote back. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const blocked = await getBlockedIds(auth.profile.id);
    const result = await toggleMemeVote(auth.profile, blocked, id);
    if (!result.ok) return badRequest(result.error, result.status);
    return NextResponse.json(result);
  } catch (e) {
    return serverError("POST meme vote", e);
  }
}
