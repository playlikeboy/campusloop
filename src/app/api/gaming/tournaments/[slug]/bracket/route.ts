import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  gamingTournamentEntries,
  gamingTournamentMatches,
  gamingTournaments,
  userProfiles,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
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

    if (tournament.organizerId !== profile.id && profile.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only tournament organizer can generate brackets" },
        { status: 403 }
      );
    }

    // Get entries
    const entries = await db.query.gamingTournamentEntries.findMany({
      where: eq(gamingTournamentEntries.tournamentId, tournament.id),
      orderBy: [asc(gamingTournamentEntries.seed)],
    });

    if (entries.length < 2) {
      return NextResponse.json(
        { error: "At least 2 entries are required to generate a bracket" },
        { status: 400 }
      );
    }

    // Determine bracket size: next power of 2 (2, 4, 8, 16, 32)
    const bracketSize = Math.max(2, Math.pow(2, Math.ceil(Math.log2(entries.length))));
    const numRounds = Math.log2(bracketSize);

    // Delete any existing matches if re-generating
    await db
      .delete(gamingTournamentMatches)
      .where(eq(gamingTournamentMatches.tournamentId, tournament.id));

    // Create matches for each round backwards or with IDs
    // Round 1 has bracketSize / 2 matches
    // Round 2 has bracketSize / 4 matches
    // Round numRounds (Finals) has 1 match
    const createdMatches: any[] = [];
    const matchIdByRoundAndIdx: Record<string, string> = {};

    // First generate all match IDs for the entire bracket tree so nextMatchId can be linked
    for (let r = 1; r <= numRounds; r++) {
      const matchCountInRound = bracketSize / Math.pow(2, r);
      for (let m = 0; m < matchCountInRound; m++) {
        const id = crypto.randomUUID();
        matchIdByRoundAndIdx[`${r}_${m}`] = id;
      }
    }

    // Now insert matches
    for (let r = 1; r <= numRounds; r++) {
      const matchCountInRound = bracketSize / Math.pow(2, r);
      const isFirstRound = r === 1;

      for (let m = 0; m < matchCountInRound; m++) {
        const matchId = matchIdByRoundAndIdx[`${r}_${m}`];
        // Winner advances to next round match at index floor(m / 2)
        const nextRoundMatchId = r < numRounds ? matchIdByRoundAndIdx[`${r + 1}_${Math.floor(m / 2)}`] : null;

        let entry1Id: string | null = null;
        let entry2Id: string | null = null;

        if (isFirstRound) {
          // Seed entries into round 1
          const idx1 = m;
          const idx2 = bracketSize - 1 - m;

          entry1Id = entries[idx1] ? entries[idx1].id : null;
          entry2Id = entries[idx2] ? entries[idx2].id : null;
        }

        const [match] = await db
          .insert(gamingTournamentMatches)
          .values({
            id: matchId,
            tournamentId: tournament.id,
            roundNumber: r,
            matchNumber: createdMatches.length + 1,
            nextMatchId: nextRoundMatchId,
            entry1Id,
            entry2Id,
            status: entry1Id && entry2Id ? "READY" : "PENDING",
          })
          .returning();

        createdMatches.push(match);
      }
    }

    // Update tournament status to IN_PROGRESS
    await db
      .update(gamingTournaments)
      .set({
        status: "IN_PROGRESS",
        updatedAt: new Date(),
      })
      .where(eq(gamingTournaments.id, tournament.id));

    // Notify all participants that tournament bracket is live
    for (const entry of entries) {
      createNotification({
        userId: entry.captainId,
        actorId: profile.id,
        type: "GAMING_MATCH_READY",
        referenceId: tournament.slug,
        previewText: `Tournament bracket is live for ${tournament.title}! View your match matchup.`,
      });
    }

    return NextResponse.json({
      success: true,
      bracketSize,
      numRounds,
      matches: createdMatches,
    });
  } catch (error: any) {
    console.error("POST /api/gaming/tournaments/[slug]/bracket error:", error);
    return NextResponse.json({ error: "Failed to generate bracket" }, { status: 500 });
  }
}
