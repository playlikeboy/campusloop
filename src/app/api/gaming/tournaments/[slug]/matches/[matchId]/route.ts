import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  gamingProgression,
  gamingTournamentEntries,
  gamingTournamentMatches,
  gamingTournaments,
  userProfiles,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; matchId: string }> }
) {
  try {
    const { slug, matchId } = await params;
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

    const match = await db.query.gamingTournamentMatches.findFirst({
      where: and(
        eq(gamingTournamentMatches.id, matchId),
        eq(gamingTournamentMatches.tournamentId, tournament.id)
      ),
      with: {
        entry1: true,
        entry2: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const isOrganizer = tournament.organizerId === profile.id || profile.role === "ADMIN";
    const isEntry1Captain = match.entry1?.captainId === profile.id;
    const isEntry2Captain = match.entry2?.captainId === profile.id;

    if (!isOrganizer && !isEntry1Captain && !isEntry2Captain) {
      return NextResponse.json(
        { error: "Forbidden: Only participants or tournament organizer can update matches" },
        { status: 403 }
      );
    }

    const body: any = await req.json().catch(() => ({}));
    const action = body.action || "REPORT"; // 'REPORT' | 'CONFIRM' | 'DISPUTE'

    if (action === "DISPUTE") {
      const reason = body.reason ? String(body.reason).trim().slice(0, 500) : "Result disputed by participant";
      const [updated] = await db
        .update(gamingTournamentMatches)
        .set({
          status: "DISPUTED",
          disputeReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(gamingTournamentMatches.id, matchId))
        .returning();

      if (tournament.organizerId !== profile.id) {
        createNotification({
          userId: tournament.organizerId,
          actorId: profile.id,
          type: "TOURNAMENT_UPDATE",
          referenceId: tournament.slug,
          previewText: `Match dispute raised in ${tournament.title}: ${reason}`,
        });
      }

      return NextResponse.json({ success: true, match: updated });
    }

    if (action === "REPORT") {
      const s1 = Math.max(0, parseInt(String(body.score1), 10) || 0);
      const s2 = Math.max(0, parseInt(String(body.score2), 10) || 0);

      if (s1 === s2) {
        return NextResponse.json(
          { error: "Single-elimination matches cannot end in a draw. A winner is required." },
          { status: 400 }
        );
      }

      const reportingEntryId = isEntry1Captain
        ? match.entry1Id
        : isEntry2Captain
          ? match.entry2Id
          : null;

      // If reported by organizer, it's immediately confirmed!
      const isConfirmed = isOrganizer;
      const winnerId = s1 > s2 ? match.entry1Id : match.entry2Id;

      const [updatedMatch] = await db
        .update(gamingTournamentMatches)
        .set({
          score1: s1,
          score2: s2,
          reportedByEntryId: reportingEntryId,
          reportedByUserId: profile.id,
          winnerId: isConfirmed ? winnerId : null,
          status: isConfirmed ? "CONFIRMED" : "REPORTED",
          updatedAt: new Date(),
        })
        .where(eq(gamingTournamentMatches.id, matchId))
        .returning();

      // If confirmed immediately by organizer, advance the winner
      if (isConfirmed && winnerId) {
        await advanceWinner(db, tournament, updatedMatch, winnerId, profile.id);
      } else {
        // Notify opponent captain to confirm score
        const opponentCaptainId = isEntry1Captain
          ? match.entry2?.captainId
          : match.entry1?.captainId;

        if (opponentCaptainId) {
          createNotification({
            userId: opponentCaptainId,
            actorId: profile.id,
            type: "TOURNAMENT_UPDATE",
            referenceId: tournament.slug,
            previewText: `Match score reported (${s1}-${s2}). Please confirm or dispute on CampusLoop.`,
          });
        }
      }

      return NextResponse.json({ success: true, match: updatedMatch });
    }

    if (action === "CONFIRM") {
      if (match.status !== "REPORTED") {
        return NextResponse.json(
          { error: "Match has not been reported yet" },
          { status: 400 }
        );
      }

      const winnerId = match.score1 > match.score2 ? match.entry1Id : match.entry2Id;
      if (!winnerId) {
        return NextResponse.json({ error: "Invalid match scores" }, { status: 400 });
      }

      const [updatedMatch] = await db
        .update(gamingTournamentMatches)
        .set({
          winnerId,
          status: "CONFIRMED",
          disputeReason: null,
          updatedAt: new Date(),
        })
        .where(eq(gamingTournamentMatches.id, matchId))
        .returning();

      await advanceWinner(db, tournament, updatedMatch, winnerId, profile.id);

      return NextResponse.json({ success: true, match: updatedMatch });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/gaming/tournaments/[slug]/matches/[matchId] error:", error);
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }
}

/**
 * Advances match winner to next round or completes tournament if finals
 */
async function advanceWinner(
  db: any,
  tournament: any,
  match: any,
  winnerId: string,
  actorId: string
) {
  const runnerUpId = match.entry1Id === winnerId ? match.entry2Id : match.entry1Id;

  if (match.nextMatchId) {
    // Advance to next round match
    const nextMatch = await db.query.gamingTournamentMatches.findFirst({
      where: eq(gamingTournamentMatches.id, match.nextMatchId),
    });

    if (nextMatch) {
      const updateData: any = { updatedAt: new Date() };
      if (!nextMatch.entry1Id) {
        updateData.entry1Id = winnerId;
      } else if (!nextMatch.entry2Id) {
        updateData.entry2Id = winnerId;
      } else {
        updateData.entry1Id = winnerId;
      }

      // If both teams are now determined in the next match, set status to READY
      const hasBothEntries =
        (updateData.entry1Id || nextMatch.entry1Id) && (updateData.entry2Id || nextMatch.entry2Id);
      if (hasBothEntries) {
        updateData.status = "READY";
      }

      await db
        .update(gamingTournamentMatches)
        .set(updateData)
        .where(eq(gamingTournamentMatches.id, match.nextMatchId));
    }
  } else {
    // Final Championship Match completed!
    await db
      .update(gamingTournaments)
      .set({
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(eq(gamingTournaments.id, tournament.id));

    // Update ranks on entries
    await db
      .update(gamingTournamentEntries)
      .set({ finalRank: 1, status: "CHECKED_IN" })
      .where(eq(gamingTournamentEntries.id, winnerId));

    if (runnerUpId) {
      await db
        .update(gamingTournamentEntries)
        .set({ finalRank: 2, status: "ELIMINATED" })
        .where(eq(gamingTournamentEntries.id, runnerUpId));
    }

    // Award progression ranking points to champions and runners-up
    const winningEntry = await db.query.gamingTournamentEntries.findFirst({
      where: eq(gamingTournamentEntries.id, winnerId),
    });

    if (winningEntry && tournament.institutionId) {
      // Winner progression
      await db
        .insert(gamingProgression)
        .values({
          userId: winningEntry.captainId,
          institutionId: tournament.institutionId,
          gameName: tournament.gameName,
          matchesPlayed: 1,
          matchesWon: 1,
          tournamentsWon: 1,
          tournamentsPlayed: 1,
          rankingPoints: 1050, // +50 LP
        })
        .onConflictDoUpdate({
          target: [
            gamingProgression.userId,
            gamingProgression.gameName,
            gamingProgression.season,
          ],
          set: {
            matchesPlayed: sql`${gamingProgression.matchesPlayed} + 1`,
            matchesWon: sql`${gamingProgression.matchesWon} + 1`,
            tournamentsWon: sql`${gamingProgression.tournamentsWon} + 1`,
            tournamentsPlayed: sql`${gamingProgression.tournamentsPlayed} + 1`,
            rankingPoints: sql`${gamingProgression.rankingPoints} + 50`,
            updatedAt: new Date(),
          },
        });

      // Send victory notification to champion
      createNotification({
        userId: winningEntry.captainId,
        actorId,
        type: "TOURNAMENT_UPDATE",
        referenceId: tournament.slug,
        previewText: `Champions! Your team won the ${tournament.title} tournament! (+50 LP)`,
      });
    }
  }
}
