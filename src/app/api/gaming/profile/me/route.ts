import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { gamerProfiles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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

    const gamerProfile = await db.query.gamerProfiles.findFirst({
      where: eq(gamerProfiles.userId, profile.id),
    });

    return NextResponse.json({
      profile: gamerProfile || {
        userId: profile.id,
        institutionId: profile.institutionId,
        primaryGame: "Valorant",
        games: [],
        platforms: ["PC"],
        playStyle: "BOTH",
        preferredAvailability: "EVENING",
        voicePreference: "DISCORD",
        isLookingForTeam: true,
        isHandlePublic: true,
        bio: "",
      },
    });
  } catch (error: any) {
    console.error("GET /api/gaming/profile/me error:", error);
    return NextResponse.json({ error: "Failed to load gamer profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
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

    if (!profile.institutionId) {
      return NextResponse.json(
        { error: "College institution verification required for gamer profile" },
        { status: 400 }
      );
    }

    const body: any = await req.json().catch(() => ({}));

    const cleanPrimaryGame = body.primaryGame
      ? String(body.primaryGame).trim().slice(0, 50)
      : "Valorant";
    const cleanPlayStyle = ["CASUAL", "COMPETITIVE", "BOTH"].includes(body.playStyle)
      ? body.playStyle
      : "BOTH";
    const cleanAvailability = [
      "EVENING",
      "LATE_NIGHT",
      "WEEKENDS",
      "FLEXIBLE",
    ].includes(body.preferredAvailability)
      ? body.preferredAvailability
      : "EVENING";
    const cleanVoice = ["DISCORD", "IN_GAME", "LISTEN_ONLY", "NO_VOICE"].includes(
      body.voicePreference
    )
      ? body.voicePreference
      : "DISCORD";
    const cleanLft = Boolean(body.isLookingForTeam);
    const cleanHandlePublic = body.isHandlePublic !== false;
    const cleanBio = body.bio ? String(body.bio).trim().slice(0, 500) : null;

    // Validate platforms array
    const validPlatforms = ["PC", "MOBILE", "PLAYSTATION", "XBOX", "SWITCH"];
    const cleanPlatforms = Array.isArray(body.platforms)
      ? body.platforms.filter((p: any) => validPlatforms.includes(String(p).toUpperCase()))
      : ["PC"];

    // Validate games array
    const cleanGames = Array.isArray(body.games)
      ? body.games
          .slice(0, 10)
          .filter((g: any) => g && typeof g.gameName === "string" && g.gameName.trim())
          .map((g: any) => ({
            gameName: String(g.gameName).trim().slice(0, 50),
            gamerTag: String(g.gamerTag || profile.username).trim().slice(0, 50),
            rankTier: g.rankTier ? String(g.rankTier).trim().slice(0, 50) : undefined,
            role: g.role ? String(g.role).trim().slice(0, 30) : undefined,
            isHandlePublic: g.isHandlePublic !== false,
          }))
      : [];

    const existing = await db.query.gamerProfiles.findFirst({
      where: eq(gamerProfiles.userId, profile.id),
    });

    let saved: any;
    if (existing) {
      const [updated] = await db
        .update(gamerProfiles)
        .set({
          primaryGame: cleanPrimaryGame,
          games: cleanGames,
          platforms: cleanPlatforms,
          playStyle: cleanPlayStyle,
          preferredAvailability: cleanAvailability,
          voicePreference: cleanVoice,
          isLookingForTeam: cleanLft,
          isHandlePublic: cleanHandlePublic,
          bio: cleanBio,
          updatedAt: new Date(),
        })
        .where(eq(gamerProfiles.id, existing.id))
        .returning();
      saved = updated;
    } else {
      const [created] = await db
        .insert(gamerProfiles)
        .values({
          userId: profile.id,
          institutionId: profile.institutionId,
          primaryGame: cleanPrimaryGame,
          games: cleanGames,
          platforms: cleanPlatforms,
          playStyle: cleanPlayStyle,
          preferredAvailability: cleanAvailability,
          voicePreference: cleanVoice,
          isLookingForTeam: cleanLft,
          isHandlePublic: cleanHandlePublic,
          bio: cleanBio,
        })
        .returning();
      saved = created;
    }

    return NextResponse.json({ success: true, profile: saved });
  } catch (error: any) {
    console.error("PUT /api/gaming/profile/me error:", error);
    return NextResponse.json({ error: "Failed to update gamer profile" }, { status: 500 });
  }
}
