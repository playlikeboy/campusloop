"use client";

import { Calendar, Loader2, Plus, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface HostTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (tournament: any) => void;
}

export function HostTournamentDialog({
  open,
  onOpenChange,
  onCreated,
}: HostTournamentDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [gameName, setGameName] = useState("Valorant");
  const [teamFormat, setTeamFormat] = useState("SQUAD_5");
  const [maxParticipants, setMaxParticipants] = useState("8");
  const [startsAt, setStartsAt] = useState("");
  const [prizePool, setPrizePool] = useState("Loop Points + Campus Esports Trophy");
  const [rules, setRules] = useState(
    "1. All players must be verified college students.\n2. Best of 1 until Championship Finals (BO3).\n3. Default server: Mumbai / Singapore."
  );
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!title.trim() || !gameName.trim() || !startsAt) {
      toast.error("Please fill in tournament title, game, and start time");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/gaming/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          gameName: gameName.trim(),
          teamFormat,
          format: "SINGLE_ELIMINATION",
          maxParticipants: parseInt(maxParticipants, 10) || 8,
          startsAt: new Date(startsAt).toISOString(),
          prizePool: prizePool.trim(),
          rules: rules.trim(),
          description: description.trim(),
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to create tournament");

      toast.success("Tournament created and open for registration!");
      onCreated?.(data.tournament);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl p-6 bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            <span>Host Campus Tournament</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Tournament Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inter-Hostel Valorant Spring Cup 2026"
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Game Title *
              </label>
              <select
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="Valorant">Valorant (5v5)</option>
                <option value="BGMI">BGMI (Squad)</option>
                <option value="Chess">Chess Blitz (1v1)</option>
                <option value="EA FC">EA FC 24 (1v1)</option>
                <option value="CS2">Counter-Strike 2 (5v5)</option>
                <option value="Rocket League">Rocket League (3v3)</option>
                <option value="Other">Other Game</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Team Format
              </label>
              <select
                value={teamFormat}
                onChange={(e) => setTeamFormat(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="SOLO">Solo (1v1)</option>
                <option value="DUO">Duo (2v2)</option>
                <option value="SQUAD_4">Squad (4v4)</option>
                <option value="SQUAD_5">Full Team (5v5)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Max Teams / Bracket Size
              </label>
              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="4">4 Teams (Semifinals + Finals)</option>
                <option value="8">8 Teams (Quarterfinals)</option>
                <option value="16">16 Teams (Round of 16)</option>
                <option value="32">32 Teams</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Tournament Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Prize / Recognition
            </label>
            <input
              type="text"
              value={prizePool}
              onChange={(e) => setPrizePool(e.target.value)}
              placeholder="e.g. CampusLoop LP + Hall of Fame Badge"
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Rules & Guidelines
            </label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              About the Tournament / Discord Link
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Provide context, Discord voice room, or match streaming link..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition active:scale-98 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trophy className="size-4" />
              )}
              <span>Publish & Open Registration</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
