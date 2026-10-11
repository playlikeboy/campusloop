import { and, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { communities, communityMembers, posts, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id: paramId } = await params;
    const db = getDb();

    // Check logged in user profile ID
    let currentProfileId: string | null = null;
    try {
      const user = await hexclaveServerApp.getUser();
      if (user) {
        const profile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, user.id),
          columns: { id: true },
        });
        currentProfileId = profile?.id ?? null;
      }
    } catch {
      // Guest
    }

    const comm = await db.query.communities.findFirst({
      where: or(eq(communities.id, paramId), eq(communities.slug, paramId)),
      with: {
        creator: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        members: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                points: true,
              },
            },
          },
        },
      },
    });

    if (!comm) {
      return NextResponse.json({ error: "Not Found", message: "Community not found" }, { status: 404 });
    }

    const activeMembers = (comm.members || []).filter((m) => m.status === "ACTIVE");
    const userMembership = currentProfileId
      ? (comm.members || []).find((m) => m.userId === currentProfileId)
      : null;

    const postsCountRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(eq(posts.communityId, comm.id), eq(posts.status, "PUBLISHED"), eq(posts.isSeeded, false)));
    const postsCount = postsCountRows[0]?.count ?? 0;

    return NextResponse.json({
      ...comm,
      membersCount: activeMembers.length,
      postsCount,
      isMember: Boolean(userMembership && userMembership.status === "ACTIVE"),
      memberRole: userMembership?.role ?? null,
      memberStatus: userMembership?.status ?? "NONE",
      isAdmin: Boolean(
        currentProfileId && (comm.creatorId === currentProfileId || userMembership?.role === "ADMIN")
      ),
    });
  } catch (error) {
    console.error("GET /api/communities/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { id: paramId } = await params;
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const isCreator = comm.creatorId === profile.id;
    const adminMembership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, comm.id),
        eq(communityMembers.userId, profile.id),
        eq(communityMembers.role, "ADMIN")
      ),
    });

    if (!isCreator && !adminMembership) {
      return NextResponse.json(
        { error: "Forbidden", message: "Only community admins can modify community settings" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof body.name === "string" && body.name.trim().length >= 2) {
      updatePayload.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updatePayload.description = typeof body.description === "string" ? body.description.trim() || null : null;
    }
    if (typeof body.category === "string") {
      updatePayload.category = body.category;
    }
    if (["PUBLIC", "PRIVATE", "UNLISTED"].includes(body.privacy)) {
      updatePayload.privacy = body.privacy;
    }
    if (typeof body.allowAnonymousPosts === "boolean") {
      updatePayload.allowAnonymousPosts = body.allowAnonymousPosts;
    }
    if (body.rules !== undefined) {
      updatePayload.rules = typeof body.rules === "string" ? body.rules : Array.isArray(body.rules) ? JSON.stringify(body.rules) : null;
    }
    if (body.avatarUrl !== undefined) {
      updatePayload.avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() || null : null;
    }
    if (body.bannerUrl !== undefined) {
      updatePayload.bannerUrl = typeof body.bannerUrl === "string" ? body.bannerUrl.trim() || null : null;
    }

    const [updated] = await db
      .update(communities)
      .set(updatePayload)
      .where(eq(communities.id, comm.id))
      .returning();

    revalidatePath(`/communities/${comm.slug || comm.id}`);
    revalidatePath(`/communities/${comm.slug || comm.id}/settings`);
    revalidatePath("/communities");

    return NextResponse.json({ success: true, community: updated });
  } catch (error) {
    console.error("PATCH /api/communities/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  try {
    const { id: paramId } = await params;
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    if (comm.creatorId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only the founding creator or admin can delete this community" },
        { status: 403 }
      );
    }

    await db.delete(communities).where(eq(communities.id, comm.id));

    revalidatePath("/communities");
    return NextResponse.json({ success: true, message: "Community deleted" });
  } catch (error) {
    console.error("DELETE /api/communities/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
