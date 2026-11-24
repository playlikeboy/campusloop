import { NextResponse } from "next/server";
import { badRequest, requirePlayer, serverError } from "@/lib/play/server/context";
import { deleteMeme } from "@/lib/play/server/memes";

export const dynamic = "force-dynamic";

/** DELETE /api/play/memes/:id: remove your own meme. You can post another this week. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const ok = await deleteMeme(auth.profile, id);
    if (!ok) return badRequest("Meme not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("DELETE meme", e);
  }
}
