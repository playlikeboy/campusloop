import { and, count, desc, eq, ne, type SQL } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import type { CollegeItem } from "@/components/colleges/college-hub-row";
import { getDb } from "@/db";
import { institutions } from "@/db/schema";
import { VIEWER_INSTITUTION_SLUG } from "@/lib/viewer";

import { COLLEGES_PAGE_SIZE } from "./directory-shared";

export { COLLEGES_PAGE_SIZE, COLLEGE_DIRECTORY_STATES, collegesHref } from "./directory-shared";

export interface CollegeDirectoryPage {
  colleges: CollegeItem[];
  page: number;
  total: number;
  totalPages: number;
}

/**
 * Same ordering and viewer-hub exclusion as GET /api/colleges, read directly
 * from the database so the directory page can ship college links in its HTML.
 * Cached for 10 minutes per (page, state); invalidate with revalidateTag("colleges").
 */
export async function getCollegeDirectoryPage(params: {
  page?: number;
  state?: string | null;
}): Promise<CollegeDirectoryPage> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const state = params.state && params.state !== "ALL" ? params.state : null;
  return cachedDirectoryPage(page, state);
}

// unstable_cache adds the (page, state) arguments to the cache key. The result
// holds only strings, numbers and nulls (no Date columns), so it survives the
// JSON round trip unchanged.
const cachedDirectoryPage = unstable_cache(loadDirectoryPage, ["college-directory-page-v1"], {
  revalidate: 600,
  tags: ["colleges"],
});

async function loadDirectoryPage(page: number, state: string | null): Promise<CollegeDirectoryPage> {
  const db = getDb();
  const offset = (page - 1) * COLLEGES_PAGE_SIZE;

  const conditions: SQL[] = [ne(institutions.slug, VIEWER_INSTITUTION_SLUG)];
  if (state) conditions.push(eq(institutions.state, state));
  const where = and(...conditions);

  const [[countResult], rows] = await Promise.all([
    db.select({ total: count() }).from(institutions).where(where),
    db.query.institutions.findMany({
      columns: {
        id: true,
        slug: true,
        name: true,
        state: true,
        district: true,
        website: true,
        yearOfEstablishment: true,
        aisheCode: true,
        logoUrl: true,
        bannerUrl: true,
        nirfRank: true,
        description: true,
        websiteDomain: true,
      },
      where,
      orderBy: [desc(institutions.createdAt)],
      limit: COLLEGES_PAGE_SIZE,
      offset,
    }),
  ]);

  const total = Number(countResult?.total ?? 0);
  return {
    colleges: rows.map((row) => ({ ...row, postCount: 0 })),
    page,
    total,
    totalPages: Math.ceil(total / COLLEGES_PAGE_SIZE) || 1,
  };
}
