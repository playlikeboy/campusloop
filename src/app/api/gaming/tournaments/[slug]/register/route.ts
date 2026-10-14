import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  gamingTournamentEntries,
  gamingTournaments,
  userProfiles,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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

    const tournament = await db.query.gamingTournaments.findFirst({
      where: eq(gamingTournaments.slug, slug),
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status !== "REGISTRATION_OPEN") {
      return NextResponse.json(
        { error: `Registration is closed (status: ${tournament.status})` },
        { status: 400 }
      );
    }

    const now = new Date();
    if (new Date(tournament.registrationDeadline) < now) {
      return NextResponse.json(
        { error: "Registration deadline has passed" },
        { status: 400 }
      );
    }

    // Check if user already registered as captain
    const existingEntry = await db.query.gamingTournamentEntries.findFirst({
      where: and(
        eq(gamingTournamentEntries.tournamentId, tournament.id),
        eq(gamingTournamentEntries.captainId, profile.id)
      ),
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "You are already registered for this tournament" },
        { status: 409 }
      );
    }

    const body: any = await req.json().catch(() => ({}));
    const teamName = body.teamName
      ? String(body.teamName).trim().slice(0, 50)
      : `${profile.displayName}'s Squad`;

    // Format roster
    const rawRoster = Array.isArray(body.roster) ? body.roster : [];
    const roster = [
      {
        userId: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        gamerTag: body.gamerTag || profile.username,
        role: "Captain",
      },
      ...rawRoster
        .filter((m: any) => m && m.userId !== profile.id)
        .slice(0, 6)
        .map((m: any) => ({
          userId: m.userId || "",
          username: String(m.username || "").slice(0, 50),
          displayName: String(m.displayName || "").slice(0, 50),
          gamerTag: String(m.gamerTag || "").slice(0, 50),
          role: String(m.role || "Member").slice(0, 30),
        })),
    ];

    // Atomically increment currentParticipants with capacity check
    const updated = await db
      .update(gamingTournaments)
      .set({
        currentParticipants: sql`${gamingTournaments.currentParticipants} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(gamingTournaments.id, tournament.id),
          eq(gamingTournaments.status, "REGISTRATION_OPEN"),
          sql`${gamingTournaments.currentParticipants} < ${gamingTournaments.maxParticipants}`
        )
      )
      .returning();

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: "Tournament is full (maximum capacity reached)" },
        { status: 409 }
      );
    }

    const currentCount = updated[0].currentParticipants;

    const [entry] = await db
      .insert(gamingTournamentEntries)
      .values({
        tournamentId: tournament.id,
        captainId: profile.id,
        teamName,
        roster,
        seed: currentCount,
        isCheckedIn: true, // auto check-in on registration for streamlined campus flow
        status: "CHECKED_IN",
      })
      .returning();

    // Notify organizer
    if (tournament.organizerId !== profile.id) {
      createNotification({
        userId: tournament.organizerId,
        actorId: profile.id,
        type: "TOURNAMENT_UPDATE",
        referenceId: tournament.slug,
        previewText: `${teamName} registered for ${tournament.title} (${currentCount}/${tournament.maxParticipants})`,
      });
    }

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/gaming/tournaments/[slug]/register error:", error);
    return NextResponse.json({ error: "Failed to register for tournament" }, { status: 500 });
  }
}
