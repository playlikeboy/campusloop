"use client";

import {
  Camera,
  EyeOff,
  Globe,
  Heart,
  RotateCcw,
  Sparkles,
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
  const isMatchingEnabled = data?.meta?.isMatchingEnabled !== false;

  const hasGenderSet = profile?.gender && ["MALE", "FEMALE", "OTHER"].includes(profile.gender);
  const genderGateRequired =
    (profile && !hasGenderSet) || (error as { error?: string } | undefined)?.error === "GENDER_REQUIRED";

  const sendSwipe = useCallback(async (targetId: string, direction: "LIKE" | "PASS") => {
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

  // Preload upcoming card photos into browser memory for zero-lag swiping
  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    const nextBatch = candidates.slice(deckIndex, deckIndex + 5);
    for (const c of nextBatch) {
      if (c.photos?.[0]) {
        const img = new Image();
        img.src = c.photos[0];
      }
    }
  }, [candidates, deckIndex]);

  const handleSwipe = useCallback(
    async (direction: "like" | "pass") => {
      const current = remaining[0];
      if (!current) return;

      const swipeDir = direction === "like" ? "LIKE" : "PASS";
      await sendSwipe(current.id, swipeDir);

      // When reaching near end of deck, revalidate
      if (deckIndex >= candidates.length - 2) {
        void mutate();
      }
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

  // Keyboard shortcuts: ← pass · → like · U undo
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
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-3 sm:px-4 text-foreground select-none min-h-0">
      {/* Matching Paused Notice */}
      {!isMatchingEnabled && (
        <div className="my-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
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

      {/* ─── Swipe Deck Section ─── */}
      <div className="flex min-h-0 flex-1 flex-col py-1">
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
      </div>

      <DatingMatchModal matchResult={matchResult} onClose={() => setMatchResult(null)} />
    </div>
  );
}
