import { and, eq, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { gamingLobbies, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function hasPlayer(players: string | null | undefined, userId: string) {
  if (!players) return false;
  try {
    const parsed = JSON.parse(players) as Array<{ userId?: string }>;
    return Array.isArray(parsed) && parsed.some((member) => member?.userId === userId);
  } catch {
    return false;
  }
}

async function getCurrentProfile() {
  const user = await hexclaveServerApp.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!profile) return { error: NextResponse.json({ error: "Profile not found" }, { status: 404 }) };
  const institutionId = profile.institutionId;
  if (!institutionId) {
    return { error: NextResponse.json({ error: "A college profile is required." }, { status: 403 }) };
  }
  return { db, profile, institutionId };
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const current = await getCurrentProfile();
    if ("error" in current) return current.error;
    const { db, profile, institutionId } = current;
    const { id } = await context.params;

    const [item] = await db
      .update(gamingLobbies)
      .set({
        players: sql`(
          COALESCE(NULLIF(${gamingLobbies.players}, ''), '[]')::jsonb
          || jsonb_build_array(jsonb_build_object(
            'userId', ${profile.id},
            'username', ${profile.username},
            'displayName', ${profile.displayName},
            'avatarUrl', ${profile.avatarUrl ?? null},
            'gamerTag', ${profile.username},
            'role', 'Player'
          ))
        )::text`,
        slotsFilled: sql`${gamingLobbies.slotsFilled} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(gamingLobbies.id, id),
          eq(gamingLobbies.institutionId, institutionId),
          eq(gamingLobbies.status, "OPEN"),
          lt(gamingLobbies.slotsFilled, gamingLobbies.slotsTotal),
          sql`NOT EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(NULLIF(${gamingLobbies.players}, ''), '[]')::jsonb) AS entry(value)
            WHERE entry.value->>'userId' = ${profile.id}
          )`
        )
      )
      .returning();

    if (item) return NextResponse.json({ success: true, joined: true, item });

    const existing = await db.query.gamingLobbies.findFirst({
      where: and(eq(gamingLobbies.id, id), eq(gamingLobbies.institutionId, institutionId)),
    });
    if (!existing) return NextResponse.json({ error: "Lobby not found in your campus." }, { status: 404 });
    if (hasPlayer(existing.players, profile.id)) {
      return NextResponse.json({ success: true, joined: true, item: existing });
    }
    if (existing.status !== "OPEN") {
      return NextResponse.json({ error: "This lobby is no longer open." }, { status: 409 });
    }
    if (existing.slotsFilled >= existing.slotsTotal) {
      return NextResponse.json({ error: "This lobby is full. Try another open squad." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not join this lobby. Refresh and try again." }, { status: 409 });
  } catch (error) {
    console.error("POST /api/communities/hub/gaming/[id]/join error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const current = await getCurrentProfile();
    if ("error" in current) return current.error;
    const { db, profile, institutionId } = current;
    const { id } = await context.params;

    const existing = await db.query.gamingLobbies.findFirst({
      where: and(eq(gamingLobbies.id, id), eq(gamingLobbies.institutionId, institutionId)),
    });
    if (!existing) return NextResponse.json({ error: "Lobby not found in your campus." }, { status: 404 });
    if (existing.hostId === profile.id) {
      return NextResponse.json({ error: "The host cannot leave their own lobby." }, { status: 400 });
    }
    if (!hasPlayer(existing.players, profile.id)) {
      return NextResponse.json({ success: true, joined: false, item: existing });
    }

    const [item] = await db
      .update(gamingLobbies)
      .set({
        players: sql`(
          SELECT COALESCE(jsonb_agg(entry.value ORDER BY entry.ordinality), '[]'::jsonb)::text
          FROM jsonb_array_elements(COALESCE(NULLIF(${gamingLobbies.players}, ''), '[]')::jsonb)
            WITH ORDINALITY AS entry(value, ordinality)
          WHERE entry.value->>'userId' <> ${profile.id}
        )`,
        slotsFilled: sql`GREATEST(1, ${gamingLobbies.slotsFilled} - 1)`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(gamingLobbies.id, id),
          eq(gamingLobbies.institutionId, institutionId),
          eq(gamingLobbies.status, "OPEN"),
          sql`EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(NULLIF(${gamingLobbies.players}, ''), '[]')::jsonb) AS entry(value)
            WHERE entry.value->>'userId' = ${profile.id}
          )`
        )
      )
      .returning();

    if (item) return NextResponse.json({ success: true, joined: false, item });
    const latest = await db.query.gamingLobbies.findFirst({
      where: and(eq(gamingLobbies.id, id), eq(gamingLobbies.institutionId, institutionId)),
    });
    return NextResponse.json({ success: true, joined: false, item: latest ?? existing });
  } catch (error) {
    console.error("DELETE /api/communities/hub/gaming/[id]/join error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
