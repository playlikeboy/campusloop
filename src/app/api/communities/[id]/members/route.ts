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

    const members = await db.query.communityMembers.findMany({
      where: and(...filters),
      orderBy: [desc(communityMembers.createdAt)],
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            points: true,
            branch: true,
            year: true,
          },
        },
      },
    });

    const filtered = q
      ? members.filter((m) => {
          const query = q.toLowerCase();
          return (
            m.user?.displayName?.toLowerCase().includes(query) ||
            m.user?.username?.toLowerCase().includes(query) ||
            m.user?.branch?.toLowerCase().includes(query)
          );
        })
      : members;

    return NextResponse.json({
      members: filtered,
      page,
      limit,
      count: filtered.length,
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

    // Verify caller is admin
    const callerMembership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, comm.id),
        eq(communityMembers.userId, profile.id),
        eq(communityMembers.role, "ADMIN")
      ),
    });

    if (comm.creatorId !== profile.id && !callerMembership) {
      return NextResponse.json(
        { error: "Forbidden", message: "Only community admins can manage member roles or status" },
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

    if (newStatus === "ACTIVE") {
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

    // Verify caller is admin
    const callerMembership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, comm.id),
        eq(communityMembers.userId, profile.id),
        eq(communityMembers.role, "ADMIN")
      ),
    });

    if (comm.creatorId !== profile.id && !callerMembership) {
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
