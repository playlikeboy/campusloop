import { and, eq, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { communities, communityMembers, userProfiles } from "@/db/schema";
import { getCachedAuthUser } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { id: paramId } = await params;
    const user = await getCachedAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", message: "Sign in required" }, { status: 401 });
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

    if (comm.creatorId === profile.id) {
      return NextResponse.json(
        { error: "Forbidden", message: "The founding creator cannot leave the community. You can archive or delete it instead." },
        { status: 400 }
      );
    }

    await db
      .delete(communityMembers)
      // A ban row survives "leaving": deleting it would let a banned member rejoin a public community.
      .where(
        and(
          eq(communityMembers.communityId, comm.id),
          eq(communityMembers.userId, profile.id),
          ne(communityMembers.status, "BANNED")
        )
      );

    revalidatePath(`/communities/${comm.slug || comm.id}`);
    revalidatePath("/communities");

    return NextResponse.json({ success: true, joined: false });
  } catch (error) {
    console.error("POST /api/communities/[id]/leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: RouteProps) {
  return POST(request, props);
}
