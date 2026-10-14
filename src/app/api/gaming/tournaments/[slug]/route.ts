import { asc, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  gamingTournamentEntries,
  gamingTournamentMatches,
  gamingTournaments,
  userProfiles,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDb();
    const user = await hexclaveServerApp.getUser();

    let currentProfile: any = null;
    if (user) {
      currentProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
      });
    }

    const tournament = await db.query.gamingTournaments.findFirst({
      where: eq(gamingTournaments.slug, slug),
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

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const [entries, matches] = await Promise.all([
      db.query.gamingTournamentEntries.findMany({
        where: eq(gamingTournamentEntries.tournamentId, tournament.id),
        orderBy: [asc(gamingTournamentEntries.seed), asc(gamingTournamentEntries.createdAt)],
        with: {
          captain: {
            columns: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      db.query.gamingTournamentMatches.findMany({
        where: eq(gamingTournamentMatches.tournamentId, tournament.id),
        orderBy: [
          asc(gamingTournamentMatches.roundNumber),
          asc(gamingTournamentMatches.matchNumber),
        ],
        with: {
          entry1: true,
          entry2: true,
          winner: true,
        },
      }),
    ]);

    const isOrganizer = currentProfile ? tournament.organizerId === currentProfile.id : false;
    const userEntry = currentProfile
      ? entries.find((e) => {
          if (e.captainId === currentProfile.id) return true;
          const roster = (e.roster as any[]) || [];
          return roster.some((member: any) => member.userId === currentProfile.id);
        })
      : null;

    return NextResponse.json({
      tournament: {
        ...tournament,
        isOrganizer,
        userEntry,
        entries,
        matches,
      },
    });
  } catch (error: any) {
    console.error("GET /api/gaming/tournaments/[slug] error:", error);
    return NextResponse.json({ error: "Failed to load tournament" }, { status: 500 });
  }
}
