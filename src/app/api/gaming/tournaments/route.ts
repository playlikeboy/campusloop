import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { gamingTournaments, userProfiles } from "@/db/schema";
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
    const game = searchParams.get("game")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const scope = searchParams.get("scope")?.trim() || "all";
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (scope === "campus" && currentProfile?.institutionId) {
      conditions.push(eq(gamingTournaments.institutionId, currentProfile.institutionId));
    }

    if (game && game.toLowerCase() !== "all") {
      conditions.push(ilike(gamingTournaments.gameName, `%${game}%`));
    }

    if (status && status.toUpperCase() !== "ALL") {
      conditions.push(eq(gamingTournaments.status, status.toUpperCase()));
    }

    if (q) {
      conditions.push(
        or(
          ilike(gamingTournaments.title, `%${q}%`),
          ilike(gamingTournaments.description, `%${q}%`),
          ilike(gamingTournaments.gameName, `%${q}%`)
        )
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    let total = 0;
    try {
      if (typeof db.select === "function") {
        const [{ value: totalValue }] = await db
          .select({ value: count(gamingTournaments.id) })
          .from(gamingTournaments)
          .where(where);
        total = Number(totalValue || 0);
      }
    } catch {
      total = 0;
    }

    const rows = await db.query.gamingTournaments.findMany({
      where,
      orderBy: [desc(gamingTournaments.startsAt)],
      limit,
      offset,
      with: {
        organizer: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
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

    return NextResponse.json({
      tournaments: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error: any) {
    console.error("GET /api/gaming/tournaments error:", error);
    return NextResponse.json({ error: "Failed to load tournaments" }, { status: 500 });
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
        { error: "College institution verification required to host tournaments" },
        { status: 400 }
      );
    }

    const body: any = await req.json().catch(() => ({}));
    const {
      title,
      gameName,
      format = "SINGLE_ELIMINATION",
      teamFormat = "SOLO",
      maxParticipants = 8,
      registrationDeadline,
      startsAt,
      rules,
      prizePool,
      description,
      bannerUrl,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Tournament title is required" }, { status: 400 });
    }

    if (!gameName || typeof gameName !== "string" || !gameName.trim()) {
      return NextResponse.json({ error: "Game name is required" }, { status: 400 });
    }

    if (!startsAt) {
      return NextResponse.json({ error: "Start date/time is required" }, { status: 400 });
    }

    const parsedStartsAt = new Date(startsAt);
    if (isNaN(parsedStartsAt.getTime())) {
      return NextResponse.json({ error: "Invalid startsAt date format" }, { status: 400 });
    }

    const parsedDeadline = registrationDeadline
      ? new Date(registrationDeadline)
      : new Date(parsedStartsAt.getTime() - 2 * 60 * 60 * 1000); // 2 hours before start

    const allowedCapacities = [4, 8, 16, 32, 64];
    const capacityNum = parseInt(String(maxParticipants), 10) || 8;
    const cleanMaxParticipants = allowedCapacities.includes(capacityNum) ? capacityNum : 8;

    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    const shortId = crypto.randomUUID().slice(0, 8);
    const slug = `${baseSlug}-${shortId}`;

    const [tournament] = await db
      .insert(gamingTournaments)
      .values({
        institutionId: profile.institutionId,
        organizerId: profile.id,
        title: title.trim().slice(0, 140),
        slug,
        description: description ? String(description).trim().slice(0, 2000) : null,
        gameName: gameName.trim().slice(0, 50),
        format: ["SINGLE_ELIMINATION", "ROUND_ROBIN"].includes(format) ? format : "SINGLE_ELIMINATION",
        teamFormat: ["SOLO", "DUO", "SQUAD_4", "SQUAD_5"].includes(teamFormat) ? teamFormat : "SOLO",
        maxParticipants: cleanMaxParticipants,
        currentParticipants: 0,
        registrationDeadline: parsedDeadline,
        startsAt: parsedStartsAt,
        rules: rules ? String(rules).trim().slice(0, 2000) : null,
        prizePool: prizePool ? String(prizePool).trim().slice(0, 200) : null,
        bannerUrl: bannerUrl ? String(bannerUrl).trim().slice(0, 255) : null,
        status: "REGISTRATION_OPEN",
      })
      .returning();

    return NextResponse.json({ success: true, tournament }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/gaming/tournaments error:", error);
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}
