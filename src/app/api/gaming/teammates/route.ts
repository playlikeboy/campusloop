import { and, desc, eq, ilike, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { gamerProfiles, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await hexclaveServerApp.getUser().catch(() => null);
    const db = getDb();

    let currentProfile: any = null;
    if (user) {
      currentProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });
    }

    const { searchParams } = new URL(req.url);
    const game = searchParams.get("game")?.trim() || "";
    const platform = searchParams.get("platform")?.trim() || "";
    const playStyle = searchParams.get("playStyle")?.trim() || "";
    const availability = searchParams.get("availability")?.trim() || "";
    const scope = searchParams.get("scope")?.trim() || "all";
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "16", 10)));
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(gamerProfiles.isLookingForTeam, true)];

    if (scope === "campus" && currentProfile?.institutionId) {
      conditions.push(eq(gamerProfiles.institutionId, currentProfile.institutionId));
    }

    if (game && game.toLowerCase() !== "all") {
      conditions.push(
        or(
          ilike(gamerProfiles.primaryGame, `%${game}%`),
          // Check inside JSON string
          ilike(gamerProfiles.primaryGame, `%${game}%`)
        )
      );
    }

    if (playStyle && playStyle.toUpperCase() !== "ALL") {
      conditions.push(
        or(eq(gamerProfiles.playStyle, playStyle.toUpperCase()), eq(gamerProfiles.playStyle, "BOTH"))
      );
    }

    if (availability && availability.toUpperCase() !== "ALL") {
      conditions.push(
        or(
          eq(gamerProfiles.preferredAvailability, availability.toUpperCase()),
          eq(gamerProfiles.preferredAvailability, "FLEXIBLE")
        )
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await db.query.gamerProfiles.findMany({
      where,
      orderBy: [desc(gamerProfiles.updatedAt)],
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            points: true,
            course: true,
            branch: true,
            year: true,
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

    // Filter and sanitize based on privacy rules
    const teammates = rows
      .filter((row) => {
        if (!q) return true;
        const text = `${row.user.displayName} ${row.user.username} ${row.primaryGame} ${row.bio || ""}`.toLowerCase();
        return text.includes(q.toLowerCase());
      })
      .map((row) => {
        const isSelf = currentProfile ? currentProfile.id === row.userId : false;
        const isHandleVisible = row.isHandlePublic || isSelf;

        const sanitizedGames = (row.games || []).map((g) => ({
          ...g,
          gamerTag: isHandleVisible && g.isHandlePublic !== false ? g.gamerTag : "Protected Handle",
        }));

        return {
          id: row.id,
          userId: row.userId,
          user: row.user,
          institution: row.institution,
          primaryGame: row.primaryGame,
          games: sanitizedGames,
          platforms: row.platforms,
          playStyle: row.playStyle,
          preferredAvailability: row.preferredAvailability,
          voicePreference: row.voicePreference,
          bio: row.bio,
          isSelf,
          updatedAt: row.updatedAt,
        };
      });

    return NextResponse.json({
      teammates,
      page,
      limit,
      total: teammates.length,
    });
  } catch (error: any) {
    console.error("GET /api/gaming/teammates error:", error);
    return NextResponse.json({ error: "Failed to load teammates" }, { status: 500 });
  }
}
