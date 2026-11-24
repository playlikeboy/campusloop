import { NextResponse } from "next/server";
import { getBlockedIds, requirePlayer, serverError } from "@/lib/play/server/context";
import { pickDpPair } from "@/lib/play/server/dp";

export const dynamic = "force-dynamic";

/** GET /api/play/dp/pair: two opted-in DPs from your campus you haven't judged together. */
export async function GET() {
  try {
    const auth = await requirePlayer();
    if (!auth.ok) return auth.response;
    const blocked = await getBlockedIds(auth.profile.id);
    return NextResponse.json(await pickDpPair(auth.profile, blocked), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return serverError("GET dp/pair", e);
  }
}
