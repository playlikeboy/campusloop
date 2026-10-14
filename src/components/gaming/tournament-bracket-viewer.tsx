"use client";

import {
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  ShieldAlert,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    if (round === total) return "Championship Final";
    if (round === total - 1) return "Semifinals";
    if (round === total - 2) return "Quarterfinals";
    return `Round ${round}`;
  }

  async function handleReportScore(matchId: string) {
    if (isSubmitting) return;
    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    if (isNaN(s1) || isNaN(s2) || s1 === s2) {
      toast.error("Please provide valid, non-equal scores (winner required)");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/gaming/tournaments/${tournamentSlug}/matches/${matchId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "REPORT", score1: s1, score2: s2 }),
        }
      );
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to report score");

      toast.success("Match score submitted!");
      setReportingMatchId(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to report match score");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmScore(matchId: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/gaming/tournaments/${tournamentSlug}/matches/${matchId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CONFIRM" }),
        }
      );
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to confirm score");

      toast.success("Match confirmed! Winner advanced.");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm match");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-muted-foreground">
        <Trophy className="mx-auto size-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm font-bold text-foreground">Bracket not generated yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          {isOrganizer
            ? "When registration ends, generate the single-elimination bracket to launch the tournament."
            : "The tournament organizer will generate the match bracket once check-ins complete."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Trophy className="size-4 text-amber-500" />
          <span>Tournament Bracket Tree</span>
        </h3>
        <span className="text-xs font-semibold text-muted-foreground">
          {totalRounds} {totalRounds === 1 ? "Round" : "Rounds"}
        </span>
      </div>

      {/* Responsive Horizontal Scroll Bracket Container */}
      <div className="overflow-x-auto pb-4 pt-1">
        <div className="flex items-stretch gap-6 min-w-max px-1">
          {roundNumbers.map((round) => {
            const roundMatches = roundsMap.get(round) || [];

            return (
              <div key={round} className="w-64 flex flex-col justify-around gap-4 shrink-0">
                <div className="text-center pb-2 border-b border-border/40">
                  <span className="text-xs font-black uppercase tracking-wider text-primary">
                    {getRoundTitle(round, totalRounds)}
                  </span>
                </div>

                <div className="space-y-4 my-auto">
                  {roundMatches.map((m) => {
                    const isWinner1 = m.winnerId && m.winnerId === m.entry1Id;
                    const isWinner2 = m.winnerId && m.winnerId === m.entry2Id;
                    const canReport =
                      (isOrganizer ||
                        m.entry1?.captainId === currentUserId ||
                        m.entry2?.captainId === currentUserId) &&
                      m.status !== "CONFIRMED";
                    const canConfirm =
                      m.status === "REPORTED" &&
                      (isOrganizer ||
                        (m.entry1?.captainId === currentUserId &&
                          m.entry1Id !== (m as any).reportedByEntryId) ||
                        (m.entry2?.captainId === currentUserId &&
                          m.entry2Id !== (m as any).reportedByEntryId));

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "rounded-xl border p-3 bg-card/80 transition-all shadow-2xs relative",
                          m.status === "CONFIRMED"
                            ? "border-emerald-500/30"
                            : m.status === "READY"
                              ? "border-primary/40 ring-1 ring-primary/20"
                              : "border-border/60"
                        )}
                      >
                        {/* Match Status Chip */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                          <span className="font-bold uppercase tracking-wider">
                            Match #{m.matchNumber}
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded font-bold uppercase tracking-wider text-[9px]",
                              m.status === "CONFIRMED"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : m.status === "REPORTED"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : m.status === "READY"
                                    ? "bg-sky-500/10 text-sky-500"
                                    : "bg-muted text-muted-foreground"
                            )}
                          >
                            {m.status}
                          </span>
                        </div>

                        {/* Team 1 */}
                        <div
                          className={cn(
                            "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
                            isWinner1
                              ? "bg-emerald-500/15 text-foreground"
                              : m.entry1
                                ? "bg-muted/40 text-foreground/90"
                                : "bg-muted/15 text-muted-foreground/60 italic"
                          )}
                        >
                          <span className="truncate max-w-[140px]">
                            {m.entry1 ? m.entry1.teamName : "TBD"}
                          </span>
                          <span className="tabular-nums font-black ml-2">{m.score1}</span>
                        </div>

                        {/* Team 2 */}
                        <div
                          className={cn(
                            "mt-1.5 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
                            isWinner2
                              ? "bg-emerald-500/15 text-foreground"
                              : m.entry2
                                ? "bg-muted/40 text-foreground/90"
                                : "bg-muted/15 text-muted-foreground/60 italic"
                          )}
                        >
                          <span className="truncate max-w-[140px]">
                            {m.entry2 ? m.entry2.teamName : "TBD"}
                          </span>
                          <span className="tabular-nums font-black ml-2">{m.score2}</span>
                        </div>

                        {/* Interactive Reporting / Confirming Actions */}
                        {m.entry1 && m.entry2 && (
                          <div className="mt-2.5 pt-2 border-t border-border/30 flex items-center justify-between gap-2">
                            {canConfirm && (
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleConfirmScore(m.id)}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-600 transition"
                              >
                                <Check className="size-3" />
                                <span>Confirm Result</span>
                              </button>
                            )}

                            {canReport && reportingMatchId !== m.id && !canConfirm && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReportingMatchId(m.id);
                                  setScore1(String(m.score1 || 0));
                                  setScore2(String(m.score2 || 0));
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                              >
                                <span>{m.status === "REPORTED" ? "Edit Score" : "Report Score"}</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* In-place Score Input */}
                        {reportingMatchId === m.id && (
                          <div className="mt-3 p-2 rounded-lg bg-muted/40 border border-primary/30 space-y-2">
                            <p className="text-[10px] font-bold text-foreground">
                              Enter final match score:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] text-muted-foreground block truncate">
                                  {m.entry1?.teamName}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={score1}
                                  onChange={(e) => setScore1(e.target.value)}
                                  className="h-8 w-full rounded border border-border bg-background px-2 text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-muted-foreground block truncate">
                                  {m.entry2?.teamName}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={score2}
                                  onChange={(e) => setScore2(e.target.value)}
                                  className="h-8 w-full rounded border border-border bg-background px-2 text-xs font-bold"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setReportingMatchId(null)}
                                className="px-2 py-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleReportScore(m.id)}
                                className="rounded bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground"
                              >
                                {isSubmitting ? "Submitting..." : "Save Score"}
                              </button>
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
    </div>
  );
}
