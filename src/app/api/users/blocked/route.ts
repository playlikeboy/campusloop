import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { blocks, userProfiles } from "@/db/schema";
import { requireProfile } from "@/lib/require-profile";

export const dynamic = "force-dynamic";

/** Students I have blocked, newest first (max 200). */
export async function GET() {
  try {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const rows = await getDb()
      .select({
        id: userProfiles.id,
        username: userProfiles.username,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        blockedAt: blocks.createdAt,
      })
      .from(blocks)
      .innerJoin(userProfiles, eq(blocks.blockedUserId, userProfiles.id))
      .where(eq(blocks.blockerId, auth.profile.id))
      .orderBy(desc(blocks.createdAt))
      .limit(200);
    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error("GET /api/users/blocked error:", error);
    return NextResponse.json({ error: "Failed to load blocked users" }, { status: 500 });
  }
}
