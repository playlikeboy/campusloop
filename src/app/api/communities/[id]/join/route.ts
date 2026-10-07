import { and, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { communities, communityMembers, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { recordStreakActivity } from "@/lib/streaks/streak-service";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { id: paramId } = await params;
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", message: "Sign in to join communities" }, { status: 401 });
    }

    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const comm = await db.query.communities.findFirst({
      where: or(eq(communities.id, paramId), eq(communities.slug, paramId)),
    });

    if (!comm) {
      return NextResponse.json({ error: "Not Found", message: "Community not found" }, { status: 404 });
    }

    // Check existing membership
    const existing = await db.query.communityMembers.findFirst({
      where: and(eq(communityMembers.communityId, comm.id), eq(communityMembers.userId, profile.id)),
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyMember: true,
        joined: existing.status === "ACTIVE",
        status: existing.status,
      });
    }

    const status = comm.privacy === "PRIVATE" ? "PENDING" : "ACTIVE";

    await db.insert(communityMembers).values({
      communityId: comm.id,
      userId: profile.id,
      role: "MEMBER",
      status,
    });

    if (status === "ACTIVE") {
      await db
        .update(communities)
        .set({ points: sql`${communities.points} + 15` })
        .where(eq(communities.id, comm.id));

      recordStreakActivity({
        userId: profile.id,
        eventType: "COMMUNITY_JOIN",
        resourceId: comm.id,
      }).catch((err) => console.warn("Failed to record streak for community join:", err));
    }

    revalidatePath(`/communities/${comm.slug || comm.id}`);
    revalidatePath("/communities");

    return NextResponse.json({
      success: true,
      joined: status === "ACTIVE",
      status,
    });
  } catch (error) {
    console.error("POST /api/communities/[id]/join error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
