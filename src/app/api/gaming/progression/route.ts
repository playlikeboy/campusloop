import { and, desc, eq, ilike } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { gamingProgression, userProfiles } from "@/db/schema";
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
    const game = searchParams.get("game")?.trim() || "Valorant";
    const season = searchParams.get("season")?.trim() || "2026-S1";
    const scope = searchParams.get("scope")?.trim() || "campus";
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));

    const conditions: any[] = [
      eq(gamingProgression.season, season),
      eq(gamingProgression.isOptedOut, false),
    ];

    if (game && game.toLowerCase() !== "all") {
      conditions.push(ilike(gamingProgression.gameName, `%${game}%`));
    }

    if (scope === "campus" && currentProfile?.institutionId) {
      conditions.push(eq(gamingProgression.institutionId, currentProfile.institutionId));
    }

    const rows = await db.query.gamingProgression.findMany({
      where: and(...conditions),
      orderBy: [
        desc(gamingProgression.rankingPoints),
        desc(gamingProgression.matchesWon),
        desc(gamingProgression.tournamentsWon),
      ],
      limit,
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
        institution: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const leaderboard = rows.map((row, index) => {
      const isSelf = currentProfile ? row.userId === currentProfile.id : false;
      const winRate =
        row.matchesPlayed > 0
          ? Math.round((row.matchesWon / row.matchesPlayed) * 100)
          : 0;

      return {
        rank: index + 1,
        id: row.id,
        userId: row.userId,
        user: row.user,
        institution: row.institution,
        gameName: row.gameName,
        rankingPoints: row.rankingPoints,
        matchesPlayed: row.matchesPlayed,
        matchesWon: row.matchesWon,
        tournamentsWon: row.tournamentsWon,
        fairPlayHonors: row.fairPlayHonors,
        winRate,
        isSelf,
      };
    });

    return NextResponse.json({
      leaderboard,
      season,
      game,
      scope,
      total: leaderboard.length,
    });
  } catch (error: any) {
    console.error("GET /api/gaming/progression error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
