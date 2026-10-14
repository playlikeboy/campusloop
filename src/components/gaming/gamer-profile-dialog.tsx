"use client";

import {
  Gamepad2,
  Headphones,
  Laptop,
  Loader2,
  Lock,
  Plus,
  Save,
  Shield,
  Smartphone,
  Trash2,
  Tv,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GamerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function GamerProfileDialog({
  open,
  onOpenChange,
  onSaved,
}: GamerProfileDialogProps) {
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
      .catch((err) => {
        console.error("Failed to load gamer profile:", err);
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
      toast.info("Maximum 8 games can be listed");
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

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      toast.success("Gamer Card updated!");
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl p-6 bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
            <Gamepad2 className="size-5 text-primary" />
            <span>Customize Your Gamer Card</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Loading profile...
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Looking for Team Status Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/50">
              <div>
                <p className="text-xs font-bold text-foreground">Looking For Team (LFT)</p>
                <p className="text-[11px] text-muted-foreground">
                  Show your card in the campus Teammates directory
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLookingForTeam(!isLookingForTeam)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isLookingForTeam ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                    isLookingForTeam ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Primary Game & Play Style */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Primary Game
                </label>
                <select
                  value={primaryGame}
                  onChange={(e) => setPrimaryGame(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="Valorant">Valorant</option>
                  <option value="BGMI">BGMI / PUBG</option>
                  <option value="Chess">Chess</option>
                  <option value="EA FC">EA FC / FIFA</option>
                  <option value="CS2">Counter-Strike 2</option>
                  <option value="Dota 2">Dota 2</option>
                  <option value="Rocket League">Rocket League</option>
                  <option value="Other">Other Game</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Play Style
                </label>
                <select
                  value={playStyle}
                  onChange={(e) => setPlayStyle(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="BOTH">Competitive & Casual</option>
                  <option value="COMPETITIVE">Competitive / Scrims</option>
                  <option value="CASUAL">Casual / Relaxed</option>
                </select>
              </div>
            </div>

            {/* Platforms Selection */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Platforms You Play On
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "PC", label: "PC", icon: Laptop },
                  { id: "MOBILE", label: "Mobile", icon: Smartphone },
                  { id: "PLAYSTATION", label: "PlayStation", icon: Tv },
                  { id: "XBOX", label: "Xbox", icon: Tv },
                ].map(({ id, label, icon: Icon }) => {
                  const active = platforms.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleTogglePlatform(id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        active
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability & Voice Preference */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Best Play Times
                </label>
                <select
                  value={preferredAvailability}
                  onChange={(e) => setPreferredAvailability(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="EVENING">Evenings (6 PM - 10 PM)</option>
                  <option value="LATE_NIGHT">Late Night (10 PM+)</option>
                  <option value="WEEKENDS">Weekends Only</option>
                  <option value="FLEXIBLE">Flexible Times</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Voice Comms
                </label>
                <select
                  value={voicePreference}
                  onChange={(e) => setVoicePreference(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="DISCORD">Discord Voice</option>
                  <option value="IN_GAME">In-game Comms Only</option>
                  <option value="LISTEN_ONLY">Listen Only (No Mic)</option>
                  <option value="NO_VOICE">No Voice (Text Comms)</option>
                </select>
              </div>
            </div>

            {/* Bio / Play Note */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Gamer Bio & Preferred Agents / Roles
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Sova / Fade main on Ascent. Looking for regular 5-stack for inter-college cups."
                rows={2}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* In-Game Handles List */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  In-Game Tags & Ranks
                </label>
                <button
                  type="button"
                  onClick={handleAddGame}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  <Plus className="size-3" />
                  <span>Add Game Handle</span>
                </button>
              </div>

              {games.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">
                  No specific game handles added yet. Click &quot;Add Game Handle&quot; to list your Riot ID, Chess username, etc.
                </p>
              ) : (
                <div className="space-y-2">
                  {games.map((g, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={g.gameName}
                          onChange={(e) => handleGameChange(idx, "gameName", e.target.value)}
                          placeholder="Game"
                          className="h-8 w-28 rounded-lg border border-border bg-background px-2 text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={g.gamerTag}
                          onChange={(e) => handleGameChange(idx, "gamerTag", e.target.value)}
                          placeholder="Riot/Gamer ID #tag"
                          className="h-8 flex-1 rounded-lg border border-border bg-background px-2 text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGame(idx)}
                          className="size-7 rounded-lg text-muted-foreground hover:text-rose-500 flex items-center justify-center transition"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={g.rankTier || ""}
                          onChange={(e) => handleGameChange(idx, "rankTier", e.target.value)}
                          placeholder="Rank (e.g. Diamond 2)"
                          className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                        />
                        <input
                          type="text"
                          value={g.role || ""}
                          onChange={(e) => handleGameChange(idx, "role", e.target.value)}
                          placeholder="Role (e.g. Controller)"
                          className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Public Handle Privacy Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-[11px] text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHandlePublic}
                  onChange={(e) => setIsHandlePublic(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>Display in-game tags publicly to fellow campus students</span>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition active:scale-98 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span>Save Gamer Card</span>
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
