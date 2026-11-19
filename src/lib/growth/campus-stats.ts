import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { institutions, posts, userProfiles } from "@/db/schema";
import { istDayStart } from "@/lib/engagement/schedule";
import { CAMPUS_UNLOCK_THRESHOLD } from "@/lib/growth/constants";
import { ONLINE_WINDOW_MS } from "@/lib/presence";
import { VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";

/** Live numbers for one college. Seeded demo profiles and posts are never counted. */
export interface CampusStats {
  institutionId: string;
  name: string;
  shortName: string;
  /** Verified, active students from this college. */
  students: number;
  /** Of those, how many had the app open in the last 2 minutes. */
  onlineNow: number;
  /** Confessions posted at this college since IST midnight. */
  confessionsToday: number;
  threshold: number;
  /** Campus confessions are open. */
  unlocked: boolean;
}

export function isCampusUnlocked(students: number): boolean {
  return students >= CAMPUS_UNLOCK_THRESHOLD;
}

/** "Birla Institute of Technology, Mesra" -> "Birla Institute of Technology". Keeps short names whole. */
export function campusShortName(name: string): string {
  return name.split(",")[0]?.trim() || name;
}

const realStudentsAt = (institutionId: string) =>
  and(
    eq(userProfiles.institutionId, institutionId),
    eq(userProfiles.isCollegeVerified, true),
    eq(userProfiles.isSeeded, false),
    eq(userProfiles.status, "ACTIVE")
  );

export async function getCampusStats(institutionId: string, now = new Date()): Promise<CampusStats | null> {
  const db = getDb();
  const [institution] = await db
    .select({ id: institutions.id, name: institutions.name, slug: institutions.slug })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1);
  if (!institution || institution.slug === VIEWER_INSTITUTION_SLUG) return null;

  const onlineSince = new Date(now.getTime() - ONLINE_WINDOW_MS);
  const [students, online, confessions] = await Promise.all([
    db.select({ n: count() }).from(userProfiles).where(realStudentsAt(institutionId)),
    db
      .select({ n: count() })
      .from(userProfiles)
      .where(and(realStudentsAt(institutionId), gte(userProfiles.lastSeenAt, onlineSince))),
    db
      .select({ n: count() })
      .from(posts)
      .where(
        and(
          eq(posts.institutionId, institutionId),
          eq(posts.type, "CONFESSION"),
          eq(posts.status, "PUBLISHED"),
          eq(posts.isSeeded, false),
          gte(posts.createdAt, istDayStart(now))
        )
      ),
  ]);

  const studentCount = Number(students[0]?.n ?? 0);
  return {
    institutionId,
    name: institution.name,
    shortName: campusShortName(institution.name),
    students: studentCount,
    onlineNow: Number(online[0]?.n ?? 0),
    confessionsToday: Number(confessions[0]?.n ?? 0),
    threshold: CAMPUS_UNLOCK_THRESHOLD,
    unlocked: isCampusUnlocked(studentCount),
  };
}
