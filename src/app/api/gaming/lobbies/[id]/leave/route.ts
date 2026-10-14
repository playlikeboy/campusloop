import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { gamingLobbies, gamingLobbyMembers, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
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

    // Host cannot leave their own lobby — they must cancel or complete it
    if (lobby.hostId === profile.id) {
      return NextResponse.json(
        { error: "As host, you cannot leave your own lobby. You can cancel or complete it instead." },
        { status: 400 }
      );
    }

    const isMember = lobby.members.some((m) => m.userId === profile.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this lobby" },
        { status: 400 }
      );
    }

    // Delete from normalized gamingLobbyMembers
    await db
      .delete(gamingLobbyMembers)
      .where(
        and(eq(gamingLobbyMembers.lobbyId, id), eq(gamingLobbyMembers.userId, profile.id))
      );

    // Atomically decrement slotsFilled and reopen if was FULL
    const [updatedLobby] = await db
      .update(gamingLobbies)
      .set({
        slotsFilled: sql`GREATEST(1, ${gamingLobbies.slotsFilled} - 1)`,
        status: sql`CASE WHEN ${gamingLobbies.status} = 'FULL' THEN 'OPEN' ELSE ${gamingLobbies.status} END`,
        updatedAt: new Date(),
      })
      .where(eq(gamingLobbies.id, id))
      .returning();

    // Sync players JSON column
    let parsedPlayers: any[] = [];
    try {
      parsedPlayers = updatedLobby.players ? JSON.parse(updatedLobby.players) : [];
    } catch {
      parsedPlayers = [];
    }

    const filteredPlayers = parsedPlayers.filter((p: any) => p.userId !== profile.id);
    await db
      .update(gamingLobbies)
      .set({ players: JSON.stringify(filteredPlayers) })
      .where(eq(gamingLobbies.id, id));

    return NextResponse.json({
      success: true,
      slotsFilled: updatedLobby.slotsFilled,
      slotsTotal: updatedLobby.slotsTotal,
      status: updatedLobby.status,
      isJoined: false,
    });
  } catch (error: any) {
    console.error("POST /api/gaming/lobbies/[id]/leave error:", error);
    return NextResponse.json({ error: "Failed to leave lobby" }, { status: 500 });
  }
}
