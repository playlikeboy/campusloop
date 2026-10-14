import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { gamingLobbies, gamingLobbyMembers, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const user = await hexclaveServerApp.getUser();

    let currentProfile: any = null;
    if (user) {
      currentProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });
    }

    const lobby = await db.query.gamingLobbies.findFirst({
      where: eq(gamingLobbies.id, id),
      with: {
        host: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            points: true,
          },
        },
        institution: {
          columns: {
            id: true,
            name: true,
            slug: true,
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

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    const isJoined = currentProfile
      ? lobby.members.some((m) => m.userId === currentProfile.id) ||
        lobby.hostId === currentProfile.id
      : false;
    const isHost = currentProfile ? lobby.hostId === currentProfile.id : false;

    return NextResponse.json({
      lobby: {
        ...lobby,
        isJoined,
        isHost,
      },
    });
  } catch (error: any) {
    console.error("GET /api/gaming/lobbies/[id] error:", error);
    return NextResponse.json({ error: "Failed to load lobby details" }, { status: 500 });
  }
}

export async function PATCH(
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
    });

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    // Only host or admin can edit lobby
    if (lobby.hostId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the lobby host can manage this lobby" },
        { status: 403 }
      );
    }

    const body: any = await req.json().catch(() => ({}));
    const updateData: any = { updatedAt: new Date() };

    if (body.title && typeof body.title === "string") {
      updateData.title = body.title.trim().slice(0, 140);
    }
    if (body.description !== undefined) {
      updateData.description = body.description ? String(body.description).trim().slice(0, 1000) : "";
    }
    if (body.status && ["OPEN", "FULL", "IN_GAME", "COMPLETED", "CANCELLED"].includes(body.status)) {
      updateData.status = body.status;
    }
    if (body.discordOrVoiceUrl !== undefined) {
      updateData.discordOrVoiceUrl = body.discordOrVoiceUrl ? String(body.discordOrVoiceUrl).trim().slice(0, 255) : null;
    }
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? String(body.scheduledAt).trim().slice(0, 50) : null;
    }
    if (body.gamerTag !== undefined) {
      updateData.gamerTag = body.gamerTag ? String(body.gamerTag).trim().slice(0, 60) : null;
    }

    const [updated] = await db
      .update(gamingLobbies)
      .set(updateData)
      .where(eq(gamingLobbies.id, id))
      .returning();

    return NextResponse.json({ success: true, lobby: updated });
  } catch (error: any) {
    console.error("PATCH /api/gaming/lobbies/[id] error:", error);
    return NextResponse.json({ error: "Failed to update lobby" }, { status: 500 });
  }
}

export async function DELETE(
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
    });

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.hostId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the lobby host can cancel this lobby" },
        { status: 403 }
      );
    }

    const [cancelled] = await db
      .update(gamingLobbies)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(eq(gamingLobbies.id, id))
      .returning();

    return NextResponse.json({ success: true, lobby: cancelled });
  } catch (error: any) {
    console.error("DELETE /api/gaming/lobbies/[id] error:", error);
    return NextResponse.json({ error: "Failed to cancel lobby" }, { status: 500 });
  }
}
