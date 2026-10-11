"use client";

import {
  Check,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  RotateCcw,
  School,
  SlidersHorizontal,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

type Prefs = {
  gender: "DEFAULT" | "MALE" | "FEMALE" | "ALL";
  scope: "GLOBAL" | "CAMPUS";
  sort: "COMPATIBILITY" | "RECENT" | "POPULAR";
  isEnabled?: boolean;
};

type PrefsResponse = {
  preferences: Prefs;
  recommendedGender: "MALE" | "FEMALE" | "ALL";
};

function Option({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        sounds.tap();
        haptics.light();
        onClick();
      }}
      className={cn(
        "flex items-center justify-between rounded-2xl border px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-[0.98]",
        selected
          ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs ring-1 ring-primary/20"
          : "border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
      )}
    >
      {children}
      {selected && <Check className="size-4 shrink-0 text-primary" />}
    </button>
  );
}

export function SettingsClient() {
  const { data, isLoading, mutate } = useSWR<PrefsResponse>("/api/dating/preferences", fetcher);
  const [saving, setSaving] = useState(false);

  const prefs = data?.preferences;
  const isEnabled = prefs?.isEnabled !== false;
  const recommended =
    data?.recommendedGender === "FEMALE" ? "Girls" : data?.recommendedGender === "MALE" ? "Guys" : "Everyone";

  async function save(updates: Partial<Prefs>) {
    if (!prefs) return;
    setSaving(true);
    void mutate(data ? { ...data, preferences: { ...prefs, ...updates } } : data, { revalidate: false });
    try {
      const res = await fetch("/api/dating/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      void mutate();
    } catch {
      toast.error("Couldn't save preferences");
      void mutate();
    } finally {
      setSaving(false);
    }
  }

  async function resetSwipes() {
    sounds.tap();
    haptics.medium();
    const res = await fetch("/api/dating/swipe", { method: "DELETE" });
    if (res.ok) toast.success("Swipe deck history reset!");
    else toast.error("Couldn't reset deck");
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-3 sm:px-4 text-foreground select-none">
      <div className="flex-1 py-2 space-y-6">
        {isLoading || !prefs ? (
          <div className="space-y-4 pt-4">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Pause Matching Card */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-foreground">Matching Profile Visibility</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isEnabled ? "Your profile is active in campus decks" : "Paused — hidden from decks"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => save({ isEnabled: !isEnabled })}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer active:scale-95",
                    isEnabled
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isEnabled ? (
                    <>
                      <Eye className="size-3.5" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="size-3.5" />
                      <span>Paused</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scope: Campus vs Global */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Discovery Radius
                </span>
                {saving && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Option
                  selected={prefs.scope === "CAMPUS"}
                  onClick={() => save({ scope: "CAMPUS" })}
                >
                  <div className="flex items-center gap-2">
                    <School className="size-4 text-emerald-600" />
                    <span>My College Only</span>
                  </div>
                </Option>
                <Option
                  selected={prefs.scope === "GLOBAL"}
                  onClick={() => save({ scope: "GLOBAL" })}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-blue-600" />
                    <span>All Colleges (India)</span>
                  </div>
                </Option>
              </div>
            </div>

            {/* Gender Preferences */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Show Me
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Option
                  selected={prefs.gender === "FEMALE"}
                  onClick={() => save({ gender: "FEMALE" })}
                >
                  <span>Girls</span>
                </Option>
                <Option
                  selected={prefs.gender === "MALE"}
                  onClick={() => save({ gender: "MALE" })}
                >
                  <span>Guys</span>
                </Option>
                <Option
                  selected={prefs.gender === "ALL"}
                  onClick={() => save({ gender: "ALL" })}
                >
                  <span>Everyone</span>
                </Option>
              </div>
            </div>

            {/* Sort Strategy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Deck Priority Algorithm
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Option
                  selected={prefs.sort === "COMPATIBILITY"}
                  onClick={() => save({ sort: "COMPATIBILITY" })}
                >
                  <span className="truncate">Interests</span>
                </Option>
                <Option
                  selected={prefs.sort === "RECENT"}
                  onClick={() => save({ sort: "RECENT" })}
                >
                  <span className="truncate">Active Now</span>
                </Option>
                <Option
                  selected={prefs.sort === "POPULAR"}
                  onClick={() => save({ sort: "POPULAR" })}
                >
                  <span className="truncate">Trending</span>
                </Option>
              </div>
            </div>

            {/* Deck Management Actions */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground px-1">
                Deck Controls
              </span>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={resetSwipes}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:bg-muted/40 transition-colors text-left cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                      <RotateCcw className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">Reset Swipe History</p>
                      <p className="text-[10px] text-muted-foreground">Unpass previously skipped profiles</p>
                    </div>
                  </div>
                </button>

                <Link
                  href="/profile/edit"
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:bg-muted/40 transition-colors text-left cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600">
                      <User className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">Edit Profile Photos &amp; Bio</p>
                      <p className="text-[10px] text-muted-foreground">Update prompt tags and campus photos</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
