import { NextResponse } from "next/server";
import { getCampusStats } from "@/lib/growth/campus-stats";
import { getCachedAuthUser, getCachedBareProfile } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

/**
 * Live numbers for the signed-in student's college: verified students,
 * who is online now, confessions today, and whether campus confessions are
 * open. Every number is a direct count; nothing is estimated or padded.
 */
export async function GET() {
  const user = await getCachedAuthUser();
  if (!user) return NextResponse.json({ campus: null });
  const profile = await getCachedBareProfile(user.id);
  if (!profile) return NextResponse.json({ campus: null });

  try {
    const campus = await getCampusStats(profile.institutionId);
    return NextResponse.json({ campus }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    console.error("GET /api/growth/campus failed:", error);
    return NextResponse.json({ campus: null }, { status: 500 });
  }
}
