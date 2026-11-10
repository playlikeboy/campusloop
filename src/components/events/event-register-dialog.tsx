"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

type Teammate = { name: string; emailOrRoll: string; role: string };

export type RegisterableEvent = {
  id: string;
  title: string;
  participationType: string;
  minTeamSize?: number | null;
  maxTeamSize?: number | null;
  loopPointsReward?: number | null;
};

export function EventRegisterDialog({
  event,
  swrKey,
  open,
  onOpenChange,
}: {
  event: RegisterableEvent;
  swrKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [regType, setRegType] = useState<"SOLO" | "TEAM">(
    event.participationType === "TEAM" ? "TEAM" : "SOLO"
  );
  const [teamName, setTeamName] = useState("");
  const [teammates, setTeammates] = useState<Teammate[]>([{ name: "", emailOrRoll: "", role: "Member" }]);
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxTeam = event.maxTeamSize || 4;
  const minTeam = event.minTeamSize || 1;
  const filledMates = teammates.filter((t) => t.name.trim());
  const points = event.loopPointsReward ?? 0;

  function updateMate(idx: number, patch: Partial<Teammate>) {
    setTeammates((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    if (regType === "TEAM") {
      if (!teamName.trim()) {
        toast.error("Add a team name to continue.");
        return;
      }
      const size = 1 + filledMates.length;
      if (size < minTeam) {
        toast.error(`Teams need at least ${minTeam} people, counting you. Add ${minTeam - size} more.`);
        return;
      }
      if (size > maxTeam) {
        toast.error(`Teams can have at most ${maxTeam} people. Remove ${size - maxTeam}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationType: regType,
          teamName: regType === "TEAM" ? teamName.trim() : null,
          teamMembers: regType === "TEAM" ? filledMates : [],
          contactPhone,
        }),
      });
      const resData = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok)
        throw new Error(resData.error || "Couldn't register you. Check your connection and try again.");

      sounds.pop();
      haptics.medium();
      onOpenChange(false);
      toast.success(
        points > 0 ? `You're in. +${points} Loop Points.` : "You're in. Your ticket is in My tickets."
      );
      void mutate(swrKey);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't register you. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register</DialogTitle>
          <DialogDescription>{event.title}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {event.participationType === "BOTH" && (
            <SegmentedControl
              fullWidth
              aria-label="Join as"
              value={regType}
              onChange={setRegType}
              options={[
                { value: "SOLO", label: "Solo" },
                { value: "TEAM", label: "Team" },
              ]}
            />
          )}

          {regType === "TEAM" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="team-name">Team name</Label>
                  <span className="text-xs tabular-nums text-fg-muted">
                    {1 + filledMates.length} of {maxTeam} people
                  </span>
                </div>
                <Input
                  id="team-name"
                  required
                  placeholder="e.g. Hostel 4 Coders"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <fieldset className="space-y-3">
                <legend className="mb-1 text-sm font-semibold text-fg">Teammates</legend>
                {teammates.map((tm, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 border-t border-border pt-3 first-of-type:border-t-0 first-of-type:pt-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-fg-muted">Person {idx + 2}</span>
                      {teammates.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove person ${idx + 2}`}
                          onClick={() => setTeammates((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        aria-label={`Person ${idx + 2} name`}
                        placeholder="Full name"
                        value={tm.name}
                        onChange={(e) => updateMate(idx, { name: e.target.value })}
                      />
                      <Input
                        aria-label={`Person ${idx + 2} college email or roll number`}
                        placeholder="College email or roll no."
                        value={tm.emailOrRoll}
                        onChange={(e) => updateMate(idx, { emailOrRoll: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
                {teammates.length + 1 < maxTeam && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setTeammates((prev) => [...prev, { name: "", emailOrRoll: "", role: "Member" }])
                    }
                  >
                    <Plus aria-hidden /> Add a teammate
                  </Button>
                )}
              </fieldset>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">Phone or WhatsApp (optional)</Label>
            <Input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <p className="text-xs text-fg-muted">So the host can reach you with event updates.</p>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full">
            {regType === "TEAM" ? "Register team" : "Register"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
