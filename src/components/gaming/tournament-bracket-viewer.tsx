"use client";

import { Check, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MATCH_STATUS: Record<string, { label: string; variant: "verified" | "warning" | "brand" | "neutral" }> =
  {
    CONFIRMED: { label: "Done", variant: "verified" },
    REPORTED: { label: "Waiting to confirm", variant: "warning" },
    READY: { label: "Ready", variant: "brand" },
  };

interface Match {
  id: string;
  roundNumber: number;
  matchNumber: number;
  entry1Id?: string | null;
  entry2Id?: string | null;
  winnerId?: string | null;
  score1: number;
  score2: number;
  status: string;
  entry1?: { id: string; teamName: string; captainId: string } | null;
  entry2?: { id: string; teamName: string; captainId: string } | null;
  winner?: { id: string; teamName: string } | null;
}

interface TournamentBracketViewerProps {
  tournamentSlug: string;
  matches: Match[];
  isOrganizer: boolean;
  currentUserId?: string;
  onRefresh: () => void;
}

function TeamRow({ name, score, won }: { name?: string; score: number; won: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-sm px-3 py-2 text-sm",
        won
          ? "bg-verified-subtle font-semibold text-fg"
          : name
            ? "bg-surface-muted text-fg"
            : "bg-surface-muted text-fg-subtle"
      )}
    >
      <span className="max-w-[150px] truncate">{name ?? "To be decided"}</span>
      <span className="ml-2 font-bold tabular-nums">{score}</span>
    </div>
  );
}

export function TournamentBracketViewer({
  tournamentSlug,
  matches,
  isOrganizer,
  currentUserId,
  onRefresh,
}: TournamentBracketViewerProps) {
  const [reportingMatchId, setReportingMatchId] = useState<string | null>(null);
  const [score1, setScore1] = useState("0");
  const [score2, setScore2] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group matches by round number
  const roundsMap = new Map<number, Match[]>();
  for (const m of matches) {
    const list = roundsMap.get(m.roundNumber) || [];
    list.push(m);
    roundsMap.set(m.roundNumber, list);
  }

  const roundNumbers = Array.from(roundsMap.keys()).sort((a, b) => a - b);
  const totalRounds = roundNumbers.length;

  function getRoundTitle(round: number, total: number) {
    if (round === total) return "Final";
    if (round === total - 1) return "Semi-finals";
    if (round === total - 2) return "Quarter-finals";
    return `Round ${round}`;
  }

  async function handleReportScore(matchId: string) {
    if (isSubmitting) return;
    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    if (isNaN(s1) || isNaN(s2) || s1 === s2) {
      toast.error("Enter both scores. They can't be equal, someone has to win.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/gaming/tournaments/${tournamentSlug}/matches/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REPORT", score1: s1, score2: s2 }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(data.error || "Couldn't save the score. Try again.");

      toast.success("Score saved. The other team needs to confirm it.");
      setReportingMatchId(null);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the score. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmScore(matchId: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/gaming/tournaments/${tournamentSlug}/matches/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CONFIRM" }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(data.error || "Couldn't confirm the result. Try again.");

      toast.success("Result confirmed. The winner moves on.");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't confirm the result. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        bordered
        size="compact"
        icon={Trophy}
        title="No bracket yet"
        description={
          isOrganizer
            ? "When sign-ups are done, make the bracket to start matches."
            : "The host will make the bracket once sign-ups close."
        }
      />
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-fg">Bracket</h3>
        <span className="text-sm tabular-nums text-fg-muted">
          {totalRounds} {totalRounds === 1 ? "round" : "rounds"}
        </span>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-stretch gap-4">
          {roundNumbers.map((round) => {
            const roundMatches = roundsMap.get(round) || [];
            return (
              <div key={round} className="flex w-64 shrink-0 flex-col gap-3">
                <p className="border-b border-border pb-2 text-center text-sm font-semibold text-fg">
                  {getRoundTitle(round, totalRounds)}
                </p>
                <div className="my-auto space-y-3">
                  {roundMatches.map((m) => {
                    const reportedBy = (m as Match & { reportedByEntryId?: string }).reportedByEntryId;
                    const canReport =
                      (isOrganizer ||
                        m.entry1?.captainId === currentUserId ||
                        m.entry2?.captainId === currentUserId) &&
                      m.status !== "CONFIRMED";
                    const canConfirm =
                      m.status === "REPORTED" &&
                      (isOrganizer ||
                        (m.entry1?.captainId === currentUserId && m.entry1Id !== reportedBy) ||
                        (m.entry2?.captainId === currentUserId && m.entry2Id !== reportedBy));
                    const status = MATCH_STATUS[m.status] ?? {
                      label: "Waiting",
                      variant: "neutral" as const,
                    };

                    return (
                      <div key={m.id} className="space-y-1.5 rounded-md border border-border bg-surface p-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-fg-muted">
                          <span>Match {m.matchNumber}</span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <TeamRow
                          name={m.entry1?.teamName}
                          score={m.score1}
                          won={Boolean(m.winnerId && m.winnerId === m.entry1Id)}
                        />
                        <TeamRow
                          name={m.entry2?.teamName}
                          score={m.score2}
                          won={Boolean(m.winnerId && m.winnerId === m.entry2Id)}
                        />

                        {m.entry1 && m.entry2 && reportingMatchId !== m.id && (canConfirm || canReport) && (
                          <div className="flex gap-2 pt-1.5">
                            {canConfirm ? (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleConfirmScore(m.id)}
                                loading={isSubmitting}
                              >
                                <Check aria-hidden /> Confirm result
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReportingMatchId(m.id);
                                  setScore1(String(m.score1 || 0));
                                  setScore2(String(m.score2 || 0));
                                }}
                              >
                                {m.status === "REPORTED" ? "Change score" : "Add score"}
                              </Button>
                            )}
                          </div>
                        )}

                        {reportingMatchId === m.id && (
                          <div className="space-y-2 border-t border-border pt-3">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                aria-label={`${m.entry1?.teamName ?? "Team 1"} score`}
                                value={score1}
                                onChange={(e) => setScore1(e.target.value)}
                              />
                              <Input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                aria-label={`${m.entry2?.teamName ?? "Team 2"} score`}
                                value={score2}
                                onChange={(e) => setScore2(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setReportingMatchId(null)}>
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReportScore(m.id)}
                                loading={isSubmitting}
                              >
                                Save score
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
