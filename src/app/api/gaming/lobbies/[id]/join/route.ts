import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { gamingLobbies, gamingLobbyMembers, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const lobby = await db.query.gamingLobbies.findFirst({
      where: eq(gamingLobbies.id, id),
      with: {
        members: true,
      },
    });

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.status !== "OPEN") {
      return NextResponse.json(
        { error: `Cannot join lobby: status is ${lobby.status}` },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const isAlreadyMember =
      lobby.hostId === profile.id || lobby.members.some((m) => m.userId === profile.id);

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "You are already a member of this lobby" },
        { status: 409 }
      );
    }

    const body: any = await req.json().catch(() => ({}));
    const role = body.role ? String(body.role).trim().slice(0, 30) : "Squad Member";
    const gamerTag = body.gamerTag
      ? String(body.gamerTag).trim().slice(0, 50)
      : profile.username;

    // Database-enforced atomic slot increment and capacity check
    // If slots_filled >= slots_total, this UPDATE returns 0 rows, preventing race condition!
    const result = await db
      .update(gamingLobbies)
      .set({
        slotsFilled: sql`${gamingLobbies.slotsFilled} + 1`,
        status: sql`CASE WHEN ${gamingLobbies.slotsFilled} + 1 >= ${gamingLobbies.slotsTotal} THEN 'FULL' ELSE ${gamingLobbies.status} END`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(gamingLobbies.id, id),
          eq(gamingLobbies.status, "OPEN"),
          sql`${gamingLobbies.slotsFilled} < ${gamingLobbies.slotsTotal}`
        )
      )
      .returning();

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "Lobby is full or no longer open" },
        { status: 409 }
      );
    }

    const updatedLobby = result[0];

    // Insert into normalized gamingLobbyMembers
    await db
      .insert(gamingLobbyMembers)
      .values({
        lobbyId: id,
        userId: profile.id,
        role,
        gamerTag,
      })
      .onConflictDoNothing();

    // Sync players JSON column for backward compatibility
    let parsedPlayers: any[] = [];
    try {
      parsedPlayers = updatedLobby.players ? JSON.parse(updatedLobby.players) : [];
    } catch {
      parsedPlayers = [];
    }

    if (!parsedPlayers.some((p: any) => p.userId === profile.id)) {
      parsedPlayers.push({
        userId: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        role,
        gamerTag,
      });

      await db
        .update(gamingLobbies)
        .set({ players: JSON.stringify(parsedPlayers) })
        .where(eq(gamingLobbies.id, id));
    }

    // Send notification to host
    if (lobby.hostId !== profile.id) {
      createNotification({
        userId: lobby.hostId,
        actorId: profile.id,
        type: "GAMING_LOBBY_JOIN",
        referenceId: lobby.id,
        previewText: `${profile.displayName} joined your ${lobby.gameName} lobby: "${lobby.title}"`,
      });

      // If lobby became full, notify host
      if (updatedLobby.status === "FULL") {
        createNotification({
          userId: lobby.hostId,
          actorId: profile.id,
          type: "GAMING_LOBBY_FULL",
          referenceId: lobby.id,
          previewText: `Your ${lobby.gameName} squad lobby is full (${updatedLobby.slotsFilled}/${updatedLobby.slotsTotal})!`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      slotsFilled: updatedLobby.slotsFilled,
      slotsTotal: updatedLobby.slotsTotal,
      status: updatedLobby.status,
      isJoined: true,
    });
  } catch (error: any) {
    console.error("POST /api/gaming/lobbies/[id]/join error:", error);
    return NextResponse.json({ error: "Failed to join lobby" }, { status: 500 });
  }
}
