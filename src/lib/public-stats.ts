import "server-only";

import { and, countDistinct, count, eq, ne, notLike, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/db";
import { academicResources, institutions, userProfiles } from "@/db/schema";
import { VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";

export type PublicStats = {
  /** Verified, non-seeded student accounts, or null below the publish threshold. */
  students: number | null;
  /** Non-seeded academic resources, or null below the publish threshold. */
  resources: number | null;
  /** Colleges with at least one verified non-seeded member, or null below threshold. */
  activeColleges: number | null;
  /** Colleges in the directory (always shown). */
  directoryColleges: number;
};

const SEED_ID_PREFIX = "seed_202609_%";
const THRESHOLDS = { students: 1000, resources: 1000, activeColleges: 25 } as const;
const REVALIDATE_SECONDS = 60 * 60;

function aboveThreshold(value: number, min: number): number | null {
  return value >= min ? value : null;
}

const viewerHubId = sql<string>`(select ${institutions.id} from ${institutions} where ${institutions.slug} = ${VIEWER_INSTITUTION_SLUG} limit 1)`;

/** Real students only: verified, active, not seeded, not a Campus Preview account. */
const realStudent = and(
  eq(userProfiles.isCollegeVerified, true),
  eq(userProfiles.isSeeded, false),
  eq(userProfiles.status, "ACTIVE"),
  notLike(userProfiles.id, SEED_ID_PREFIX),
  sql`${userProfiles.institutionId} is distinct from ${viewerHubId}`
);

async function countDirectoryColleges(): Promise<number> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ value: count() })
      .from(institutions)
      .where(ne(institutions.slug, VIEWER_INSTITUTION_SLUG));
    return Number(row?.value ?? 0);
  } catch {
    return 0;
  }
}

async function computePublicStats(): Promise<PublicStats> {
  const directoryColleges = await countDirectoryColleges();
  try {
    const db = getDb();

    const [studentRow] = await db
      .select({ students: count(), colleges: countDistinct(userProfiles.institutionId) })
      .from(userProfiles)
      .where(realStudent);

    const [resourceRow] = await db
      .select({ value: count() })
      .from(academicResources)
      .innerJoin(userProfiles, eq(academicResources.uploaderId, userProfiles.id))
      .where(
        and(
          notLike(academicResources.id, SEED_ID_PREFIX),
          eq(userProfiles.isSeeded, false),
          notLike(userProfiles.id, SEED_ID_PREFIX)
        )
      );

    return {
      students: aboveThreshold(Number(studentRow?.students ?? 0), THRESHOLDS.students),
      resources: aboveThreshold(Number(resourceRow?.value ?? 0), THRESHOLDS.resources),
      activeColleges: aboveThreshold(Number(studentRow?.colleges ?? 0), THRESHOLDS.activeColleges),
      directoryColleges,
    };
  } catch (error) {
    console.error("getPublicStats failed:", error);
    return { students: null, resources: null, activeColleges: null, directoryColleges };
  }
}

const cachedPublicStats = unstable_cache(computePublicStats, ["public-stats-v1"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["public-stats"],
});

/**
 * Public marketing counts. Never throws; a live number is returned only when it
 * clears the publish threshold, so callers render copy without numbers on null.
 */
export async function getPublicStats(): Promise<PublicStats> {
  try {
    return await cachedPublicStats();
  } catch {
    return { students: null, resources: null, activeColleges: null, directoryColleges: 0 };
  }
}
