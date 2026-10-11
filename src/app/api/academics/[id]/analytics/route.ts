import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { academicResources, academicResourceVotes, savedAcademicResources } from "@/db/schema";
import { getRedis } from "@/lib/redis";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { recordStreakActivity } from "@/lib/streaks/streak-service";
import { trackUserBehavior } from "@/lib/user-behavior";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

import { analyticsRateLimitCache } from "@/lib/analytics-cache";
import { runInBackground } from "@/lib/background";

async function checkAndApplyRateLimit(key: string, ttlSeconds: number): Promise<boolean> {
  const redisClient = getRedis();
  if (redisClient) {
    try {
      const res = await redisClient.set(key, "1", { nx: true, ex: ttlSeconds });
      return res === "OK";
    } catch {
      // Redis error fallback
    }
  }

  const now = Date.now();
  const existing = analyticsRateLimitCache.get(key);
  if (existing && now < existing) {
    return false; // deduplicated / rate limited
  }

  analyticsRateLimitCache.set(key, now + ttlSeconds * 1000);
  if (analyticsRateLimitCache.size > 5000) {
    for (const [k, exp] of analyticsRateLimitCache.entries()) {
      if (now > exp) analyticsRateLimitCache.delete(k);
    }
  }
  return true;
}

function getClientIdentifier(req: Request, userId?: string | null): string {
  if (userId) return `u_${userId}`;
  const h = req.headers;
  const ip =
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "guest";
  return `ip_${ip}`;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = ((await req.json().catch(() => ({}))) || {}) as Record<string, any>;
    const { action } = body;

    const db = getDb();
    const resource = await db.query.academicResources.findFirst({
      where: eq(academicResources.id, id),
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    let user = null;
    try {
      user = await getCachedAuthUser();
    } catch {}

    // ── VIEW ACTION ──
    if (action === "VIEW") {
      const clientId = getClientIdentifier(req, user?.id);
      const rateLimitKey = `ratelimit:academic:view:${id}:${clientId}`;
      // Deduplicate views for 1 hour (3600 seconds)
      const allowed = await checkAndApplyRateLimit(rateLimitKey, 3600);

      if (!allowed) {
        return NextResponse.json({
          success: true,
          viewsCount: resource.viewsCount,
          deduplicated: true,
        });
      }

      // Atomic DB counter increment
      const [updated] = await db
        .update(academicResources)
        .set({
          viewsCount: sql`${academicResources.viewsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(academicResources.id, id))
        .returning();

      if (user && updated) {
        trackUserBehavior({
          userId: user.id,
          eventType: "POST_VIEW",
          targetType: "POST",
          targetId: id,
          metadata: {
            resourceId: id,
            action: "VIEW",
            subjectCode: updated.subjectCode,
            branch: updated.branch,
            interests: [updated.subjectName, updated.subjectCode, updated.branch].filter(Boolean),
          },
          weight: 1,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, viewsCount: updated?.viewsCount ?? resource.viewsCount });
    }

    // ── DOWNLOAD ACTION ──
    if (action === "DOWNLOAD") {
      const clientId = getClientIdentifier(req, user?.id);
      const rateLimitKey = `ratelimit:academic:download:${id}:${clientId}`;
      // Deduplicate downloads for 10 minutes (600 seconds)
      const allowed = await checkAndApplyRateLimit(rateLimitKey, 600);

      if (!allowed) {
        return NextResponse.json({
          success: true,
          downloadsCount: resource.downloadsCount,
          deduplicated: true,
        });
      }

      // Atomic DB counter increment
      const [updated] = await db
        .update(academicResources)
        .set({
          downloadsCount: sql`${academicResources.downloadsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(academicResources.id, id))
        .returning();

      if (user && updated) {
        trackUserBehavior({
          userId: user.id,
          eventType: "POST_VIEW",
          targetType: "POST",
          targetId: id,
          metadata: {
            resourceId: id,
            action: "DOWNLOAD",
            subjectCode: updated.subjectCode,
            branch: updated.branch,
            interests: [updated.subjectName, updated.subjectCode, updated.branch].filter(Boolean),
          },
          weight: 2,
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        downloadsCount: updated?.downloadsCount ?? resource.downloadsCount,
      });
    }

    // ── UPVOTE ACTION ──
    // UPVOTE MUST require authentication and be unique per user/resource (idempotent, one active upvote per user)
    if (action === "UPVOTE") {
      if (!user?.id) {
        return NextResponse.json({ error: "Authentication required to upvote" }, { status: 401 });
      }

      const profile = await getCachedUserProfile(user.id);
      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 403 });
      }

      const existingVote = await db.query.academicResourceVotes.findFirst({
        where: and(eq(academicResourceVotes.resourceId, id), eq(academicResourceVotes.profileId, profile.id)),
      });

      // Idempotency: user already upvoted this resource
      if (existingVote?.voteType === "UPVOTE") {
        return NextResponse.json({
          success: true,
          upvotesCount: resource.upvotesCount,
          downvotesCount: resource.downvotesCount,
          userVote: "UPVOTE",
          alreadyVoted: true,
        });
      }

      let updated = resource;

      if (existingVote?.voteType === "DOWNVOTE") {
        // Switch from DOWNVOTE to UPVOTE
        await db
          .update(academicResourceVotes)
          .set({ voteType: "UPVOTE" })
          .where(eq(academicResourceVotes.id, existingVote.id));

        const [res] = await db
          .update(academicResources)
          .set({
            upvotesCount: sql`${academicResources.upvotesCount} + 1`,
            downvotesCount: sql`GREATEST(0, ${academicResources.downvotesCount} - 1)`,
            updatedAt: new Date(),
          })
          .where(eq(academicResources.id, id))
          .returning();
        updated = res;
      } else {
        // Fresh upvote
        await db.insert(academicResourceVotes).values({
          id: crypto.randomUUID(),
          resourceId: id,
          profileId: profile.id,
          voteType: "UPVOTE",
        });

        const [res] = await db
          .update(academicResources)
          .set({
            upvotesCount: sql`${academicResources.upvotesCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(academicResources.id, id))
          .returning();
        updated = res;
      }

      trackUserBehavior({
        userId: user.id,
        eventType: "POST_DWELL",
        targetType: "POST",
        targetId: id,
        metadata: {
          resourceId: id,
          action: "UPVOTE",
          subjectCode: updated.subjectCode,
          branch: updated.branch,
          interests: [updated.subjectName, updated.subjectCode, updated.branch].filter(Boolean),
        },
        weight: 3,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        upvotesCount: updated.upvotesCount,
        downvotesCount: updated.downvotesCount,
        userVote: "UPVOTE",
      });
    }

    // ── DOWNVOTE ACTION ──
    if (action === "DOWNVOTE") {
      if (!user?.id) {
        return NextResponse.json({ error: "Authentication required to downvote" }, { status: 401 });
      }

      const profile = await getCachedUserProfile(user.id);
      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 403 });
      }

      const existingVote = await db.query.academicResourceVotes.findFirst({
        where: and(eq(academicResourceVotes.resourceId, id), eq(academicResourceVotes.profileId, profile.id)),
      });

      // Idempotency: user already downvoted this resource
      if (existingVote?.voteType === "DOWNVOTE") {
        return NextResponse.json({
          success: true,
          upvotesCount: resource.upvotesCount,
          downvotesCount: resource.downvotesCount,
          userVote: "DOWNVOTE",
          alreadyVoted: true,
        });
      }

      let updated = resource;

      if (existingVote?.voteType === "UPVOTE") {
        // Switch from UPVOTE to DOWNVOTE
        await db
          .update(academicResourceVotes)
          .set({ voteType: "DOWNVOTE" })
          .where(eq(academicResourceVotes.id, existingVote.id));

        const [res] = await db
          .update(academicResources)
          .set({
            upvotesCount: sql`GREATEST(0, ${academicResources.upvotesCount} - 1)`,
            downvotesCount: sql`${academicResources.downvotesCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(academicResources.id, id))
          .returning();
        updated = res;
      } else {
        // Fresh downvote
        await db.insert(academicResourceVotes).values({
          id: crypto.randomUUID(),
          resourceId: id,
          profileId: profile.id,
          voteType: "DOWNVOTE",
        });

        const [res] = await db
          .update(academicResources)
          .set({
            downvotesCount: sql`${academicResources.downvotesCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(academicResources.id, id))
          .returning();
        updated = res;
      }

      return NextResponse.json({
        success: true,
        upvotesCount: updated.upvotesCount,
        downvotesCount: updated.downvotesCount,
        userVote: "DOWNVOTE",
      });
    }

    // ── UNDO_UPVOTE ACTION ──
    if (action === "UNDO_UPVOTE") {
      if (!user?.id) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const profile = await getCachedUserProfile(user.id);
      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 403 });
      }

      const existingVote = await db.query.academicResourceVotes.findFirst({
        where: and(eq(academicResourceVotes.resourceId, id), eq(academicResourceVotes.profileId, profile.id)),
      });

      let updated = resource;

      if (existingVote?.voteType === "UPVOTE") {
        await db.delete(academicResourceVotes).where(eq(academicResourceVotes.id, existingVote.id));

        const [res] = await db
          .update(academicResources)
          .set({
            upvotesCount: sql`GREATEST(0, ${academicResources.upvotesCount} - 1)`,
            updatedAt: new Date(),
          })
          .where(eq(academicResources.id, id))
          .returning();
        updated = res;
      }

      return NextResponse.json({
        success: true,
        upvotesCount: updated.upvotesCount,
        downvotesCount: updated.downvotesCount,
        userVote: null,
      });
    }

    // ── UNDO_DOWNVOTE ACTION ──
    if (action === "UNDO_DOWNVOTE") {
      if (!user?.id) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const profile = await getCachedUserProfile(user.id);
      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 403 });
      }

      const existingVote = await db.query.academicResourceVotes.findFirst({
        where: and(eq(academicResourceVotes.resourceId, id), eq(academicResourceVotes.profileId, profile.id)),
      });

      let updated = resource;

      if (existingVote?.voteType === "DOWNVOTE") {
        await db.delete(academicResourceVotes).where(eq(academicResourceVotes.id, existingVote.id));

        const [res] = await db
          .update(academicResources)
          .set({
            downvotesCount: sql`GREATEST(0, ${academicResources.downvotesCount} - 1)`,
            updatedAt: new Date(),
          })
          .where(eq(academicResources.id, id))
          .returning();
        updated = res;
      }

      return NextResponse.json({
        success: true,
        upvotesCount: updated.upvotesCount,
        downvotesCount: updated.downvotesCount,
        userVote: null,
      });
    }

    // ── SAVE ACTION ──
    if (action === "SAVE") {
      if (user) {
        const profile = await getCachedUserProfile(user.id);
        if (profile) {
          await db
            .insert(savedAcademicResources)
            .values({
              id: crypto.randomUUID(),
              profileId: profile.id,
              resourceId: id,
              semester: resource.semester || 1,
            })
            .onConflictDoNothing();

          trackUserBehavior({
            userId: user.id,
            eventType: "POST_BOOKMARK",
            targetType: "POST",
            targetId: id,
            metadata: {
              resourceId: id,
              action: "SAVE",
              resourceType: resource.resourceType,
              subjectCode: resource.subjectCode,
              branch: resource.branch,
              semester: resource.semester,
              interests: [resource.subjectName, resource.subjectCode, resource.resourceType].filter(Boolean),
            },
            weight: 4,
          }).catch(() => {});

          runInBackground(
            recordStreakActivity({
              userId: profile.id,
              eventType: "ACADEMIC_BOOKMARK",
              resourceId: id,
            }),
            "streak activity"
          );
        }
      }

      return NextResponse.json({ success: true, isSaved: true });
    }

    // ── UNSAVE ACTION ──
    if (action === "UNSAVE") {
      if (user) {
        const profile = await getCachedUserProfile(user.id);
        if (profile) {
          await db
            .delete(savedAcademicResources)
            .where(
              and(eq(savedAcademicResources.profileId, profile.id), eq(savedAcademicResources.resourceId, id))
            );
        }
      }

      return NextResponse.json({ success: true, isSaved: false });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating academic analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
