import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courseCertificates, courses, courseWishlist } from "@/db/schema";
import { listMyLearning, requireProfile } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

/** My learning: enrolled courses with progress, certificates and wishlist. */
export async function GET() {
  const auth = await requireProfile();
  if (auth.error) return auth.error;
  const db = getDb();
  const [learning, certificates, wishlist] = await Promise.all([
    listMyLearning(auth.profile.id),
    db
      .select({ id: courseCertificates.id, courseTitle: courseCertificates.courseTitle, issuedAt: courseCertificates.issuedAt, slug: courses.slug })
      .from(courseCertificates)
      .innerJoin(courses, eq(courses.id, courseCertificates.courseId))
      .where(eq(courseCertificates.profileId, auth.profile.id))
      .orderBy(desc(courseCertificates.issuedAt)),
    db
      .select({ course: courses })
      .from(courseWishlist)
      .innerJoin(courses, eq(courses.id, courseWishlist.courseId))
      .where(eq(courseWishlist.profileId, auth.profile.id)),
  ]);
  return NextResponse.json({ learning, certificates, wishlist: wishlist.map((w) => w.course) });
}
