"use client";

import {
  ArrowLeft,
  Camera,
  EyeOff,
  Globe,
  Heart,
  Lock,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { DatingCardSkeleton } from "@/components/dating/dating-card-skeleton";
import { DatingMatchModal } from "@/components/dating/dating-match-modal";
import { SecretCrushModal } from "@/components/dating/secret-crush-modal";
import { type Candidate, SwipeActions, SwipeDeck } from "@/components/dating/swipe-deck";
import { useProfile } from "@/hooks/use-profile";
import { fetcher } from "@/lib/api";

type MatchResult = {
  matched: boolean;
  conversationId?: string;
  matchedUser?: { displayName: string; avatarUrl: string | null };
};

type ProfilesResponse = {
  candidates: Candidate[];
  meta: {
    showingGender: "MALE" | "FEMALE" | "ALL";
    likesYouCount: number;
    isMatchingEnabled?: boolean;
  };
};

export function DatingAppClient() {
  const { profile, mutate: mutateProfile } = useProfile();

  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [deckIndex, setDeckIndex] = useState(0);
  const [lastSwipedId, setLastSwipedId] = useState<string | null>(null);
  const [showSecretCrushModal, setShowSecretCrushModal] = useState(false);

  const [selectedGenderGate, setSelectedGenderGate] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [isSavingGender, setIsSavingGender] = useState(false);

  // Saved DB preferences drive the deck server-side — no params needed.
  const { data, error, isLoading, mutate } = useSWR<ProfilesResponse>("/api/dating/profiles", fetcher, {
    revalidateIfStale: true,
    keepPreviousData: true,
    dedupingInterval: 15000,
  });

  const candidates = useMemo(() => data?.candidates ?? [], [data]);
  const remaining = useMemo(() => candidates.slice(deckIndex), [candidates, deckIndex]);
  const likesYouCount = data?.meta?.likesYouCount ?? 0;
  const isMatchingEnabled = data?.meta?.isMatchingEnabled !== false;

  const hasGenderSet = profile?.gender && ["MALE", "FEMALE", "OTHER"].includes(profile.gender);
  const genderGateRequired =
    (profile && !hasGenderSet) || (error as { error?: string } | undefined)?.error === "GENDER_REQUIRED";

  const sendSwipe = useCallback(async (targetId: string, direction: "LIKE" | "PASS") => {
    // Advance the deck immediately — waiting on the round trip made every
    // swipe feel like it stuck. Rolled back below if the request fails.
    setLastSwipedId(targetId);
    setDeckIndex((prev) => prev + 1);

    try {
      const res = await fetch("/api/dating/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, direction }),
      });
      if (!res.ok) throw new Error("Swipe failed");
      const result = (await res.json()) as MatchResult;

      if (result.matched) {
        setMatchResult(result);
      }
      return result;
    } catch {
      setDeckIndex((prev) => Math.max(prev - 1, 0));
      setLastSwipedId(null);
      toast.error("Swipe failed — please try again.");
    }
    return null;
  }, []);

  // Preload upcoming card photos into browser memory for zero-lag mobile swiping
  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    const nextBatch = candidates.slice(deckIndex, deckIndex + 5);
    for (const c of nextBatch) {
      for (const photo of c.photos || []) {
        if (typeof window !== "undefined" && photo) {
          const img = new Image();
          img.src = photo;
        }
      }
    }
  }, [candidates, deckIndex]);

  const handleSwipe = useCallback(
    (direction: "like" | "pass") => {
      const current = remaining[0];
      if (!current) return;

      if (candidates.length - (deckIndex + 1) <= 3) {
        void mutate();
      }
      void sendSwipe(current.id, direction === "like" ? "LIKE" : "PASS");
    },
    [remaining, candidates.length, deckIndex, sendSwipe, mutate]
  );

  const handleUndo = useCallback(async () => {
    if (!lastSwipedId) return;
    try {
      const res = await fetch(`/api/dating/swipe?targetId=${encodeURIComponent(lastSwipedId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Rewind failed");
      setDeckIndex((i) => Math.max(0, i - 1));
      setLastSwipedId(null);
      toast.success("Rewound last profile");
    } catch {
      toast.error("Couldn't undo");
    }
  }, [lastSwipedId]);

  // ← pass · → like · U undo
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (matchResult) return;
      if (e.key === "ArrowLeft") handleSwipe("pass");
      else if (e.key === "ArrowRight") handleSwipe("like");
      else if (e.key.toLowerCase() === "u") void handleUndo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSwipe, handleUndo, matchResult]);

  async function widenSearch(updates: { gender?: string; scope?: string; isEnabled?: boolean }) {
    await fetch("/api/dating/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setDeckIndex(0);
    setLastSwipedId(null);
    void mutate();
  }

  async function handleResetSwipes() {
    const res = await fetch("/api/dating/swipe", { method: "DELETE" });
    if (res.ok) {
      setDeckIndex(0);
      setLastSwipedId(null);
      void mutate();
    }
  }

  async function handleSaveGenderGate(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingGender(true);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender: selectedGenderGate }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await mutateProfile();
      void mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSavingGender(false);
    }
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col px-4 bg-background text-foreground select-none">
      {/* ─── Top Bar ─── */}
      <header className="flex items-center justify-between py-3 border-b border-border/30">
        <Link
          href="/feeds"
          aria-label="Back to feed"
          className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40 cursor-pointer"
        >
          <ArrowLeft className="size-4.5" />
        </Link>

        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-2xs">
            <Heart className="size-3.5 fill-primary" />
          </div>
          <h1 className="text-sm font-black tracking-tight text-foreground leading-tight">Campus Match</h1>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Secret Crush Vault */}
          <Link
            href="/crush"
            aria-label="Secret Crush Vault"
            title="Secret Crush Vault"
            className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:text-primary hover:bg-muted transition-colors border border-border/40 cursor-pointer"
          >
            <Lock className="size-4" />
          </Link>

          <Link
            href="/matching/likes"
            aria-label="Likes you"
            title="Profiles that liked you"
            className="relative flex size-9 items-center justify-center rounded-full bg-muted/60 text-primary hover:bg-muted transition-colors border border-border/40 cursor-pointer"
          >
            <Heart className="size-4.5 fill-primary/20" />
            {likesYouCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground shadow-xs">
                {likesYouCount > 9 ? "9+" : likesYouCount}
              </span>
            )}
          </Link>

          <Link
            href="/matching/filters"
            aria-label="Preferences"
            title="Match Preferences"
            className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40 cursor-pointer"
          >
            <SlidersHorizontal className="size-4" />
          </Link>
        </div>
      </header>

      {/* Matching Paused Notice */}
      {!isMatchingEnabled && (
        <div className="mt-2.5 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold min-w-0">
            <EyeOff className="size-4 shrink-0" />
            <span className="truncate">Profile paused &amp; hidden</span>
          </div>
          <button
            type="button"
            onClick={() => widenSearch({ isEnabled: true })}
            className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-xs shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
          >
            Resume
          </button>
        </div>
      )}

      {/* Secret Crush Modal */}
      <SecretCrushModal isOpen={showSecretCrushModal} onClose={() => setShowSecretCrushModal(false)} />

      {/* ─── Deck ─── */}
      <main className="flex min-h-0 flex-1 flex-col py-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
        {genderGateRequired ? (
          <div className="m-auto w-full max-w-sm space-y-4 rounded-3xl border border-border/60 bg-card/90 backdrop-blur-xl p-6 text-center shadow-lg">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Heart className="size-6 fill-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-black text-foreground">Select Your Identity</h2>
              <p className="text-xs text-muted-foreground">
                Personalize recommendations with verified peers
              </p>
            </div>
            <form onSubmit={handleSaveGenderGate} className="space-y-3.5 pt-1">
              <div className="grid grid-cols-3 gap-2">
                {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGenderGate(g)}
                    className={`cursor-pointer rounded-2xl border py-2 text-xs font-bold transition-all ${
                      selectedGenderGate === g
                        ? "border-primary bg-primary/15 text-primary font-black shadow-xs ring-1 ring-primary"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : "Other"}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={isSavingGender}
                className="w-full cursor-pointer rounded-full bg-primary py-2.5 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-95 disabled:opacity-50"
              >
                {isSavingGender ? "Saving..." : "Start Matching"}
              </button>
            </form>
          </div>
        ) : isLoading && candidates.length === 0 ? (
          <DatingCardSkeleton />
        ) : remaining.length > 0 ? (
          <>
            <div className="relative min-h-0 flex-1 py-1">
              <SwipeDeck candidates={remaining} onSwipe={handleSwipe} />
            </div>
            <div className="pt-2">
              <SwipeActions
                onPass={() => handleSwipe("pass")}
                onLike={() => handleSwipe("like")}
                onUndo={() => void handleUndo()}
                canUndo={!!lastSwipedId}
              />
            </div>
            {/* Desktop Keyboard Shortcuts Hint */}
            <div className="hidden sm:flex items-center justify-center gap-3 pt-2 text-[11px] text-muted-foreground/70 select-none">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">←</kbd> Pass
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">→</kbd> Match
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">U</kbd> Rewind
              </span>
            </div>
          </>
        ) : (
          <div className="m-auto w-full max-w-sm space-y-4 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-7 text-center shadow-xs">
            <div className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-40" />
              <Sparkles className="size-6 text-primary relative z-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground">All Caught Up Nearby</h3>
              <p className="text-xs text-muted-foreground">
                Expand your scope to meet students across other campuses
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => widenSearch({ scope: "GLOBAL", gender: "ALL" })}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-95"
              >
                <Globe className="size-4" /> Explore All Campuses
              </button>
              <button
                type="button"
                onClick={handleResetSwipes}
                className="flex w-full cursor-pointer items-center justify-center gap-2 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
              >
                <RotateCcw className="size-3.5" /> Reset Swipes
              </button>
              <Link
                href="/profile/edit"
                className="flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
              >
                <Camera className="size-3.5" /> Edit Dating Profile
              </Link>
            </div>
          </div>
        )}
      </main>

      <DatingMatchModal matchResult={matchResult} onClose={() => setMatchResult(null)} />
    </div>
  );
}
