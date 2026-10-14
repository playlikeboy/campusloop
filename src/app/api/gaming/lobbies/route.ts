import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { gamingLobbies, gamingLobbyMembers, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await hexclaveServerApp.getUser();
    const db = getDb();

    let currentProfile: any = null;
    if (user) {
      currentProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const game = searchParams.get("game")?.trim() || "";
    const mode = searchParams.get("mode")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const scope = searchParams.get("scope")?.trim() || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // Filter by campus if requested and user has institution
    if (scope === "campus" && currentProfile?.institutionId) {
      conditions.push(eq(gamingLobbies.institutionId, currentProfile.institutionId));
    }

    // Filter by game
    if (game && game.toLowerCase() !== "all") {
      conditions.push(ilike(gamingLobbies.gameName, `%${game}%`));
    }

    // Filter by mode (5v5, 1v1, SCRIM, RANKED, TOURNAMENT, CASUAL)
    if (mode && mode.toUpperCase() !== "ALL") {
      conditions.push(eq(gamingLobbies.mode, mode.toUpperCase()));
    }

    // Filter by status (OPEN, FULL, IN_GAME, COMPLETED, CANCELLED)
    if (status && status.toUpperCase() !== "ALL") {
      conditions.push(eq(gamingLobbies.status, status.toUpperCase()));
    } else if (!status) {
      // By default show active lobbies: OPEN and FULL
      conditions.push(or(eq(gamingLobbies.status, "OPEN"), eq(gamingLobbies.status, "FULL")));
    }

    // Text search
    if (q) {
      conditions.push(
        or(
          ilike(gamingLobbies.gameName, `%${q}%`),
          ilike(gamingLobbies.title, `%${q}%`),
          ilike(gamingLobbies.description, `%${q}%`),
          ilike(gamingLobbies.mode, `%${q}%`),
          ilike(gamingLobbies.rankTier, `%${q}%`),
          ilike(gamingLobbies.gamerTag, `%${q}%`)
        )
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    let total = 0;
    try {
      if (typeof db.select === "function") {
        const [{ value: totalValue }] = await db
          .select({ value: count(gamingLobbies.id) })
          .from(gamingLobbies)
          .where(where);
        total = Number(totalValue || 0);
      }
    } catch {
      total = 0;
    }

    const rows = await db.query.gamingLobbies.findMany({
      where,
      orderBy: [desc(gamingLobbies.createdAt)],
      limit,
      offset,
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
              },
            },
          },
        },
      },
    });

    const items = rows.map((lobby) => {
      const isJoined = currentProfile
        ? lobby.members.some((m) => m.userId === currentProfile.id) ||
          lobby.hostId === currentProfile.id
        : false;
      const isHost = currentProfile ? lobby.hostId === currentProfile.id : false;

      return {
        ...lobby,
        isJoined,
        isHost,
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error: any) {
    console.error("GET /api/gaming/lobbies error:", error);
    return NextResponse.json({ error: "Failed to load lobbies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await hexclaveServerApp.getUser().catch(() => null);
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

    if (!profile.institutionId) {
      return NextResponse.json(
        { error: "College institution verification required to host lobbies" },
        { status: 400 }
      );
    }

    const body: any = await req.json().catch(() => ({}));
    const {
      title,
      gameName,
      mode = "5v5",
      rankTier,
      gamerTag,
      slotsTotal = 5,
      discordOrVoiceUrl,
      scheduledAt = "Now",
      description = "",
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Lobby title is required" }, { status: 400 });
    }

    if (!gameName || typeof gameName !== "string" || !gameName.trim()) {
      return NextResponse.json({ error: "Game name is required" }, { status: 400 });
    }

    const cleanSlots = Math.min(10, Math.max(2, parseInt(String(slotsTotal), 10) || 5));
    const cleanTitle = title.trim().slice(0, 140);
    const cleanGameName = gameName.trim().slice(0, 50);
    const cleanMode = String(mode).trim().toUpperCase().slice(0, 20);
    const cleanGamerTag = gamerTag ? String(gamerTag).trim().slice(0, 60) : profile.username;
    const cleanRankTier = rankTier ? String(rankTier).trim().slice(0, 50) : null;
    const cleanScheduledAt = scheduledAt ? String(scheduledAt).trim().slice(0, 50) : "Now";
    const cleanVoiceUrl = discordOrVoiceUrl ? String(discordOrVoiceUrl).trim().slice(0, 255) : null;
    const cleanDescription = description ? String(description).trim().slice(0, 1000) : "";

    const [lobby] = await db
      .insert(gamingLobbies)
      .values({
        institutionId: profile.institutionId,
        hostId: profile.id,
        gameName: cleanGameName,
        title: cleanTitle,
        description: cleanDescription,
        mode: cleanMode,
        rankTier: cleanRankTier,
        gamerTag: cleanGamerTag,
        slotsTotal: cleanSlots,
        slotsFilled: 1,
        discordOrVoiceUrl: cleanVoiceUrl,
        scheduledAt: cleanScheduledAt,
        status: "OPEN",
        players: JSON.stringify([
          {
            userId: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            role: "Host",
            gamerTag: cleanGamerTag,
          },
        ]),
      })
      .returning();

    // Insert host into normalized gamingLobbyMembers
    await db.insert(gamingLobbyMembers).values({
      lobbyId: lobby.id,
      userId: profile.id,
      role: "Host",
      gamerTag: cleanGamerTag,
    });

    return NextResponse.json({ success: true, lobby }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/gaming/lobbies error:", error);
    return NextResponse.json({ error: "Failed to create gaming lobby" }, { status: 500 });
  }
}
