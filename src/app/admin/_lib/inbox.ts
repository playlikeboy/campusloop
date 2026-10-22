import "server-only";

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import type { getDb } from "@/db";
import { institutionRequests, institutions, oauthClients, posts, reports, userProfiles } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

/** Counts of everything waiting for an admin decision. Each query fails soft to 0. */
export async function getInboxCounts(db: Db) {
  const n = (q: Promise<{ n: number }[]>) => q.then(([r]) => Number(r?.n ?? 0)).catch(() => 0);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [reviewPosts, openReports, hubRequests, newApps] = await Promise.all([
    n(db.select({ n: count() }).from(posts).where(eq(posts.status, "PENDING_REVIEW"))),
    n(db.select({ n: count() }).from(reports).where(eq(reports.status, "OPEN"))),
    n(db.select({ n: count() }).from(institutionRequests).where(eq(institutionRequests.status, "PENDING"))),
    n(db.select({ n: count() }).from(oauthClients).where(gte(oauthClients.createdAt, weekAgo))),
  ]);
  return { reviewPosts, openReports, hubRequests, newApps, total: reviewPosts + openReports + hubRequests };
}

export async function getInboxItems(db: Db) {
  const [heldPosts, openReports, hubRequests, apps] = await Promise.all([
    db
      .select({ id: posts.id, body: posts.body, type: posts.type, riskScore: posts.riskScore, createdAt: posts.createdAt, college: institutions.name })
      .from(posts)
      .leftJoin(institutions, eq(posts.institutionId, institutions.id))
      .where(eq(posts.status, "PENDING_REVIEW"))
      .orderBy(desc(posts.riskScore), desc(posts.createdAt))
      .limit(5)
      .catch(() => []),
    db
      .select({ id: reports.id, targetType: reports.targetType, targetId: reports.targetId, reason: reports.reason, details: reports.details, createdAt: reports.createdAt, reporter: userProfiles.username })
      .from(reports)
      .leftJoin(userProfiles, eq(userProfiles.id, reports.reporterId))
      .where(eq(reports.status, "OPEN"))
      .orderBy(desc(reports.createdAt))
      .limit(5)
      .catch(() => []),
    db
      .select({
        id: institutionRequests.id,
        name: institutionRequests.suggestedInstitutionName,
        domain: institutionRequests.emailDomain,
        state: institutionRequests.state,
        district: institutionRequests.district,
        createdAt: institutionRequests.createdAt,
        requester: userProfiles.username,
      })
      .from(institutionRequests)
      .leftJoin(userProfiles, sql`${userProfiles.userId} = ${institutionRequests.userId} or ${userProfiles.id} = ${institutionRequests.userId}`)
      .where(eq(institutionRequests.status, "PENDING"))
      .orderBy(desc(institutionRequests.createdAt))
      .limit(10)
      .catch(() => []),
    db
      .select({ id: oauthClients.id, name: oauthClients.name, usersCount: oauthClients.usersCount, isFirstParty: oauthClients.isFirstParty, status: oauthClients.status, createdAt: oauthClients.createdAt, owner: userProfiles.username })
      .from(oauthClients)
      .leftJoin(userProfiles, eq(userProfiles.id, oauthClients.ownerProfileId))
      .orderBy(desc(oauthClients.createdAt))
      .limit(5)
      .catch(() => []),
  ]);
  return { heldPosts, openReports, hubRequests, apps };
}

/** Real headline numbers only (no placeholders). */
export async function getHeadline(db: Db) {
  const [row] = await db
    .select({
      students: sql<number>`(select count(*) from ${userProfiles})::int`,
      newToday: sql<number>`(select count(*) from ${userProfiles} where ${userProfiles.createdAt} >= current_date)::int`,
      postsToday: sql<number>`(select count(*) from ${posts} where ${posts.createdAt} >= current_date)::int`,
      verified: sql<number>`(select count(*) from ${userProfiles} where ${userProfiles.isCollegeVerified})::int`,
    })
    .from(sql`(select 1) as one`)
    .catch(() => []);
  return row ?? { students: 0, newToday: 0, postsToday: 0, verified: 0 };
}

export const hubRequestWhere = (id: string) => and(eq(institutionRequests.id, id), eq(institutionRequests.status, "PENDING"));
