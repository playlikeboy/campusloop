import { NextResponse } from "next/server";
import { getBranchWars } from "@/lib/play/server/branch-wars";
import { requirePlayer, serverError } from "@/lib/play/server/context";
import { previousWeekKey, weekEndsAt, weekKey } from "@/lib/play/week";

export const dynamic = "force-dynamic";

/** GET /api/play/branch-wars?week=last: this (or last) week's branch table for your campus. */
export async function GET(req: Request) {
  try {
    const auth = await requirePlayer();
    if (!auth.ok) return auth.response;
    const last = new URL(req.url).searchParams.get("week") === "last";
    const week = last ? previousWeekKey() : weekKey();
    const data = await getBranchWars(auth.profile, week);
    return NextResponse.json({ week, isLastWeek: last, endsAt: weekEndsAt(), ...data });
  } catch (e) {
    return serverError("GET branch-wars", e);
  }
}
