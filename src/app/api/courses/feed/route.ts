import { NextResponse } from "next/server";
import { listFeedCourses } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

/** Unlisted community courses for the feed's "Rising courses" slot. */
export async function GET() {
  try {
    const courses = await listFeedCourses(6);
    return NextResponse.json({ courses }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=600" } });
  } catch (error) {
    console.error("GET /api/courses/feed error:", error);
    return NextResponse.json({ courses: [] });
  }
}
