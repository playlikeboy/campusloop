"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fieldClassName, Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const selectClass = cn(fieldClassName, "h-11");

interface HostTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (tournament: any) => void;
}

export function HostTournamentDialog({ open, onOpenChange, onCreated }: HostTournamentDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [gameName, setGameName] = useState("Valorant");
  const [teamFormat, setTeamFormat] = useState("SQUAD_5");
  const [maxParticipants, setMaxParticipants] = useState("8");
  const [startsAt, setStartsAt] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [rules, setRules] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!title.trim() || !gameName.trim() || !startsAt) {
      toast.error("Add a name, a game and a start time to continue.");
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

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(data.error || "Couldn't create the tournament. Try again.");

      toast.success("Tournament is live. Teams can sign up now.");
      onCreated?.(data.tournament);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the tournament. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Host a tournament</DialogTitle>
          <DialogDescription>Teams sign up here, then you make the bracket.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Name</Label>
            <Input
              id="t-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hostel Valorant Cup"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-game">Game</Label>
              <select
                id="t-game"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className={selectClass}
              >
                <option value="Valorant">Valorant</option>
                <option value="BGMI">BGMI</option>
                <option value="Chess">Chess</option>
                <option value="EA FC">EA FC</option>
                <option value="CS2">Counter-Strike 2</option>
                <option value="Rocket League">Rocket League</option>
                <option value="Other">Something else</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-format">Team size</Label>
              <select
                id="t-format"
                value={teamFormat}
                onChange={(e) => setTeamFormat(e.target.value)}
                className={selectClass}
              >
                <option value="SOLO">Solo (1v1)</option>
                <option value="DUO">Duo (2v2)</option>
                <option value="SQUAD_4">Squad (4v4)</option>
                <option value="SQUAD_5">Full team (5v5)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-max">How many teams</Label>
              <select
                id="t-max"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className={selectClass}
              >
                <option value="4">4 teams</option>
                <option value="8">8 teams</option>
                <option value="16">16 teams</option>
                <option value="32">32 teams</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-start">Starts</Label>
              <Input
                id="t-start"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-prize">Prize (optional)</Label>
            <Input
              id="t-prize"
              value={prizePool}
              onChange={(e) => setPrizePool(e.target.value)}
              placeholder="e.g. Canteen treat for the winners"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-rules">Rules (optional)</Label>
            <Textarea
              id="t-rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
              placeholder="e.g. Best of 1, final is best of 3. Mumbai server."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-about">Anything else (optional)</Label>
            <Textarea
              id="t-about"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Discord link, stream link, where to meet"
            />
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            Create tournament
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
