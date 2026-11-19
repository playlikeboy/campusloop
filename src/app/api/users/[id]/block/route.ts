import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { blocks } from "@/db/schema";
import { invalidateViewerAffinity } from "@/lib/recommendations/viewer-affinity";
import { requireProfile } from "@/lib/require-profile";
import { findTargetProfile } from "../../_target";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Block / unblock a student (`:id` is a profile id or username).
 * A block hides their posts from the feed (both directions) and stops new
 * direct messages either way.
 */
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;
    const target = await findTargetProfile((await params).id);
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.id === profile.id) return NextResponse.json({ error: "You can't block yourself" }, { status: 400 });

    await getDb().insert(blocks).values({ blockerId: profile.id, blockedUserId: target.id }).onConflictDoNothing();
    await Promise.all([invalidateViewerAffinity(profile.id), invalidateViewerAffinity(target.id)]).catch(() => {});
    return NextResponse.json({ ok: true, blocked: true, userId: target.id });
  } catch (error) {
    console.error("POST /api/users/[id]/block error:", error);
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const auth = await requireProfile({ profileStatus: 403 });
    if (!auth.ok) return auth.response;
    const { profile } = auth;
    const target = await findTargetProfile((await params).id);
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await getDb()
      .delete(blocks)
      .where(and(eq(blocks.blockerId, profile.id), eq(blocks.blockedUserId, target.id)));
    await Promise.all([invalidateViewerAffinity(profile.id), invalidateViewerAffinity(target.id)]).catch(() => {});
    return NextResponse.json({ ok: true, blocked: false, userId: target.id });
  } catch (error) {
    console.error("DELETE /api/users/[id]/block error:", error);
    return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
  }
}
