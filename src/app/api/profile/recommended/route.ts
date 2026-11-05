import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/require-profile";
import { getRecommendedUsers } from "@/lib/recommendations/recommended-users";
import { rejectViewerWrite } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const { profile } = auth;

    const viewerBlocked = await rejectViewerWrite(profile);
    if (viewerBlocked) return viewerBlocked;

    const { searchParams } = new URL(req.url);
    const scope = (searchParams.get("scope") as "CAMPUS" | "GLOBAL") || "GLOBAL";
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "6", 10), 12);

    const users = await getRecommendedUsers(profile.id, {
      limit,
      scope,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching recommended users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
