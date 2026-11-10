import { NextResponse } from "next/server";
import { currentProfile, findPublishedCourse, recordCourseView, trackCourseInterest } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

async function hashIp(ip: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`course-view:${ip}`));
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Counts a course page view (one per viewer per day). Drives catalog promotion. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const course = await findPublishedCourse((await params).slug);
  if (!course) return NextResponse.json({ ok: false }, { status: 404 });
  const profile = await currentProfile();
  // Creators viewing their own course do not count.
  if (profile && profile.id === course.creatorId) return NextResponse.json({ ok: true });
  if (profile) await trackCourseInterest(profile.id, course, "COURSE_VIEW");
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  await recordCourseView(course.id, profile ? `u:${profile.id}` : `ip:${await hashIp(ip)}`);
  return NextResponse.json({ ok: true });
}
