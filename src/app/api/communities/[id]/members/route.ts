import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { communities, communityMembers, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id: paramId } = await params;
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || url.searchParams.get("search");
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status") || "ACTIVE";
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || "30")));
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const offset = (page - 1) * limit;

    const db = getDb();
    const comm = await db.query.communities.findFirst({
      where: or(eq(communities.id, paramId), eq(communities.slug, paramId)),
      columns: { id: true, name: true, slug: true, creatorId: true },
    });

    if (!comm) {
      return NextResponse.json({ error: "Not Found", message: "Community not found" }, { status: 404 });
    }

    const filters = [
      eq(communityMembers.communityId, comm.id),
      eq(communityMembers.status, status),
    ];

    if (role) {
      filters.push(eq(communityMembers.role, role));
    }

    // Push search directly into SQL query across displayName, username, and branch
    if (q && q.trim()) {
      const pattern = `%${q.trim()}%`;
      filters.push(
        or(
          ilike(userProfiles.displayName, pattern),
          ilike(userProfiles.username, pattern),
          ilike(userProfiles.branch, pattern)
        )!
      );
    }

    const whereClause = and(...filters);

    // Get total count of matching members directly in SQL
    const totalCountRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityMembers)
      .innerJoin(userProfiles, eq(communityMembers.userId, userProfiles.id))
      .where(whereClause);

    const totalCount = totalCountRows[0]?.count ?? 0;

    // Get paginated results directly in SQL
    const rows = await db
      .select({
        id: communityMembers.id,
        communityId: communityMembers.communityId,
        userId: communityMembers.userId,
        role: communityMembers.role,
        status: communityMembers.status,
        createdAt: communityMembers.createdAt,
        user: {
          id: userProfiles.id,
          username: userProfiles.username,
          displayName: userProfiles.displayName,
          avatarUrl: userProfiles.avatarUrl,
          points: userProfiles.points,
          branch: userProfiles.branch,
          year: userProfiles.year,
        },
      })
      .from(communityMembers)
      .innerJoin(userProfiles, eq(communityMembers.userId, userProfiles.id))
      .where(whereClause)
      .orderBy(desc(communityMembers.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      members: rows,
      page,
      limit,
      totalCount,
      count: rows.length,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("GET /api/communities/[id]/members error:", error);
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

    // Verify caller is active admin or creator
    const callerMembership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, comm.id),
        eq(communityMembers.userId, profile.id),
        eq(communityMembers.role, "ADMIN"),
        eq(communityMembers.status, "ACTIVE")
      ),
    });

    const isCreator = comm.creatorId === profile.id;

    if (!isCreator && !callerMembership) {
      return NextResponse.json(
        { error: "Forbidden", message: "Only active community admins can manage member roles or status" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      targetUserId?: string;
      status?: string;
      role?: string;
    };
    const { targetUserId, status: newStatus, role: newRole } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Bad Request", message: "targetUserId is required" }, { status: 400 });
    }

    // Prevent privilege escalation: creator cannot be modified
    if (targetUserId === comm.creatorId) {
      return NextResponse.json(
        { error: "Forbidden", message: "The founding creator's role or status cannot be modified" },
        { status: 403 }
      );
    }

    // Admins cannot modify their own role/status to escalate or bypass restrictions
    if (!isCreator && targetUserId === profile.id) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admins cannot modify their own role or status" },
        { status: 403 }
      );
    }

    const targetMember = await db.query.communityMembers.findFirst({
      where: and(eq(communityMembers.communityId, comm.id), eq(communityMembers.userId, targetUserId)),
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Not Found", message: "Target member not found in this community" }, { status: 404 });
    }

    // Non-creator admins cannot modify other admins
    if (!isCreator && targetMember.role === "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only the founding creator can modify other admins" },
        { status: 403 }
      );
    }

    // Non-creator admins cannot grant the ADMIN role
    if (!isCreator && newRole === "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only the founding creator can assign the ADMIN role" },
        { status: 403 }
      );
    }

    const updatePayload: Record<string, unknown> = {};
    if (newStatus && ["ACTIVE", "PENDING", "BANNED"].includes(newStatus)) {
      updatePayload.status = newStatus;
    }
    if (newRole && ["ADMIN", "MODERATOR", "MEMBER"].includes(newRole)) {
      updatePayload.role = newRole;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Bad Request", message: "No valid status or role provided" }, { status: 400 });
    }

    const [updated] = await db
      .update(communityMembers)
      .set(updatePayload)
      .where(and(eq(communityMembers.communityId, comm.id), eq(communityMembers.userId, targetUserId)))
      .returning();

    if (newStatus === "ACTIVE" && targetMember.status !== "ACTIVE") {
      await db
        .update(communities)
        .set({ points: sql`${communities.points} + 15` })
        .where(eq(communities.id, comm.id));
    }

    revalidatePath(`/communities/${comm.slug || comm.id}/members`);
    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    console.error("PATCH /api/communities/[id]/members error:", error);
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

    // Verify caller is active admin or creator
    const callerMembership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, comm.id),
        eq(communityMembers.userId, profile.id),
        eq(communityMembers.role, "ADMIN"),
        eq(communityMembers.status, "ACTIVE")
      ),
    });

    const isCreator = comm.creatorId === profile.id;

    if (!isCreator && !callerMembership) {
      return NextResponse.json(
        { error: "Forbidden", message: "Only community admins can remove members" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const targetUserId = url.searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "Bad Request", message: "userId query parameter is required" }, { status: 400 });
    }

    if (targetUserId === comm.creatorId) {
      return NextResponse.json({ error: "Forbidden", message: "The founding creator cannot be removed" }, { status: 403 });
    }

    const targetMember = await db.query.communityMembers.findFirst({
      where: and(eq(communityMembers.communityId, comm.id), eq(communityMembers.userId, targetUserId)),
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Not Found", message: "Target member not found in this community" }, { status: 404 });
    }

    // Non-creator admins cannot remove other admins
    if (!isCreator && targetMember.role === "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only the founding creator can remove an admin" },
        { status: 403 }
      );
    }

    await db
      .delete(communityMembers)
      .where(and(eq(communityMembers.communityId, comm.id), eq(communityMembers.userId, targetUserId)));

    revalidatePath(`/communities/${comm.slug || comm.id}/members`);
    return NextResponse.json({ success: true, message: "Member removed" });
  } catch (error) {
    console.error("DELETE /api/communities/[id]/members error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
