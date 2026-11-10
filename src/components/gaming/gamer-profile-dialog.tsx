"use client";

import { Laptop, Plus, Smartphone, Trash2, Tv } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fieldClassName, Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const selectClass = cn(fieldClassName, "h-11");

const PLATFORMS = [
  { id: "PC", label: "PC", icon: Laptop },
  { id: "MOBILE", label: "Phone", icon: Smartphone },
  { id: "PLAYSTATION", label: "PlayStation", icon: Tv },
  { id: "XBOX", label: "Xbox", icon: Tv },
];

interface GamerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function GamerProfileDialog({ open, onOpenChange, onSaved }: GamerProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [primaryGame, setPrimaryGame] = useState("Valorant");
  const [playStyle, setPlayStyle] = useState("BOTH");
  const [preferredAvailability, setPreferredAvailability] = useState("EVENING");
  const [voicePreference, setVoicePreference] = useState("DISCORD");
  const [isLookingForTeam, setIsLookingForTeam] = useState(true);
  const [isHandlePublic, setIsHandlePublic] = useState(true);
  const [bio, setBio] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["PC"]);
  const [games, setGames] = useState<
    Array<{
      gameName: string;
      gamerTag: string;
      rankTier?: string;
      role?: string;
      isHandlePublic?: boolean;
    }>
  >([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/gaming/profile/me")
      .then((res) => res.json())
      .then((data: any) => {
        if (data.profile) {
          const p = data.profile;
          setPrimaryGame(p.primaryGame || "Valorant");
          setPlayStyle(p.playStyle || "BOTH");
          setPreferredAvailability(p.preferredAvailability || "EVENING");
          setVoicePreference(p.voicePreference || "DISCORD");
          setIsLookingForTeam(p.isLookingForTeam !== false);
          setIsHandlePublic(p.isHandlePublic !== false);
          setBio(p.bio || "");
          setPlatforms(p.platforms || ["PC"]);
          setGames(p.games || []);
        }
      })
      .catch(() => {
        toast.error("Couldn't load your gamer card. You can still fill it in.");
      })
      .finally(() => setLoading(false));
  }, [open]);

  function handleTogglePlatform(plat: string) {
    if (platforms.includes(plat)) {
      if (platforms.length > 1) setPlatforms(platforms.filter((p) => p !== plat));
    } else {
      setPlatforms([...platforms, plat]);
    }
  }

  function handleAddGame() {
    if (games.length >= 8) {
      toast.info("You can add up to 8 games.");
      return;
    }
    setGames([
      ...games,
      {
        gameName: "Valorant",
        gamerTag: "",
        rankTier: "Gold",
        role: "Duelist",
        isHandlePublic: true,
      },
    ]);
  }

  function handleRemoveGame(idx: number) {
    setGames(games.filter((_, i) => i !== idx));
  }

  function handleGameChange(idx: number, field: string, value: any) {
    const updated = [...games];
    updated[idx] = { ...updated[idx], [field]: value };
    setGames(updated);
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/gaming/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryGame,
          playStyle,
          preferredAvailability,
          voicePreference,
          isLookingForTeam,
          isHandlePublic,
          bio,
          platforms,
          games,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(data.error || "Couldn't save your gamer card. Try again.");

      toast.success("Gamer card saved.");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your gamer card. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your gamer card</DialogTitle>
          <DialogDescription>This is what other players see when they look for teammates.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3" role="status" aria-label="Loading your gamer card">
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        ) : (
          <div className="space-y-5">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border p-4">
              <span>
                <span className="block font-semibold text-fg">Looking for a team</span>
                <span className="block text-sm text-fg-muted">Show me in Find teammates</span>
              </span>
              <Switch checked={isLookingForTeam} onCheckedChange={setIsLookingForTeam} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="g-main">Main game</Label>
                <select
                  id="g-main"
                  value={primaryGame}
                  onChange={(e) => setPrimaryGame(e.target.value)}
                  className={selectClass}
                >
                  <option value="Valorant">Valorant</option>
                  <option value="BGMI">BGMI</option>
                  <option value="Chess">Chess</option>
                  <option value="EA FC">EA FC</option>
                  <option value="CS2">Counter-Strike 2</option>
                  <option value="Dota 2">Dota 2</option>
                  <option value="Rocket League">Rocket League</option>
                  <option value="Other">Something else</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-style">How you play</Label>
                <select
                  id="g-style"
                  value={playStyle}
                  onChange={(e) => setPlayStyle(e.target.value)}
                  className={selectClass}
                >
                  <option value="BOTH">Ranked and casual</option>
                  <option value="COMPETITIVE">Competitive</option>
                  <option value="CASUAL">Casual</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-time">When you play</Label>
                <select
                  id="g-time"
                  value={preferredAvailability}
                  onChange={(e) => setPreferredAvailability(e.target.value)}
                  className={selectClass}
                >
                  <option value="EVENING">Evenings (6 to 10 pm)</option>
                  <option value="LATE_NIGHT">Late night (after 10 pm)</option>
                  <option value="WEEKENDS">Weekends</option>
                  <option value="FLEXIBLE">Any time</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-voice">Voice chat</Label>
                <select
                  id="g-voice"
                  value={voicePreference}
                  onChange={(e) => setVoicePreference(e.target.value)}
                  className={selectClass}
                >
                  <option value="DISCORD">Discord</option>
                  <option value="IN_GAME">In-game voice</option>
                  <option value="LISTEN_ONLY">I listen, no mic</option>
                  <option value="NO_VOICE">Text only</option>
                </select>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-semibold text-fg">Where you play</legend>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(({ id, label, icon: Icon }) => (
                  <Chip
                    key={id}
                    selected={platforms.includes(id)}
                    onClick={() => handleTogglePlatform(id)}
                    icon={<Icon />}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="g-bio">About you (optional)</Label>
              <Textarea
                id="g-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Sova main. Want a regular 5-stack for weekend games."
                rows={2}
              />
            </div>

            <fieldset className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <legend className="text-sm font-semibold text-fg">Game IDs and ranks</legend>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddGame}>
                  <Plus aria-hidden /> Add game
                </Button>
              </div>
              {games.length === 0 ? (
                <p className="text-sm text-fg-muted">
                  Add your Riot ID, BGMI ID or chess username so people can find you.
                </p>
              ) : (
                games.map((g, idx) => (
                  <div key={idx} className="space-y-2 border-t border-border pt-3 first-of-type:border-t-0">
                    <div className="flex items-center gap-2">
                      <Input
                        aria-label={`Game ${idx + 1} name`}
                        value={g.gameName}
                        onChange={(e) => handleGameChange(idx, "gameName", e.target.value)}
                        placeholder="Game"
                        className="w-32"
                      />
                      <Input
                        aria-label={`Game ${idx + 1} player ID`}
                        value={g.gamerTag}
                        onChange={(e) => handleGameChange(idx, "gamerTag", e.target.value)}
                        placeholder="Player ID, e.g. name#tag"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGame(idx)}
                        aria-label={`Remove game ${idx + 1}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        aria-label={`Game ${idx + 1} rank`}
                        value={g.rankTier || ""}
                        onChange={(e) => handleGameChange(idx, "rankTier", e.target.value)}
                        placeholder="Rank, e.g. Diamond 2"
                      />
                      <Input
                        aria-label={`Game ${idx + 1} role`}
                        value={g.role || ""}
                        onChange={(e) => handleGameChange(idx, "role", e.target.value)}
                        placeholder="Role, e.g. Controller"
                      />
                    </div>
                  </div>
                ))
              )}
            </fieldset>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-fg">
              <Checkbox checked={isHandlePublic} onCheckedChange={(v) => setIsHandlePublic(Boolean(v))} />
              Show my game IDs to other students
            </label>

            <Button onClick={handleSave} loading={saving} className="w-full">
              Save gamer card
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
