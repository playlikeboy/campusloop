import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/courses/server";
import { courseSlotFor } from "@/lib/courses/recommend";

export const dynamic = "force-dynamic";

/**
 * Courses for the feed slot: personalised for signed-in students (branch,
 * interests, searches, viewed and enrolled courses), popular for visitors,
 * with rising community courses mixed in either way.
 */
export async function GET() {
  try {
    const profile = await currentProfile();
    const slot = await courseSlotFor(profile ? { id: profile.id, branch: profile.branch, course: profile.course, interests: profile.interests } : null);
    return NextResponse.json(slot, {
      headers: { "Cache-Control": profile ? "private, max-age=120" : "public, max-age=60, s-maxage=120, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("GET /api/courses/feed error:", error);
    return NextResponse.json({ title: "", personalised: false, courses: [] });
  }
}
